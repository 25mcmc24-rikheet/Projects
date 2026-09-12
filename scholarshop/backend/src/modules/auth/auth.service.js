'use strict';

const { pool, withTransaction } = require('../../config/db');
const env = require('../../config/env');
const { sendOTPEmail } = require('../../services/email.service');
const { isAllowedUniversityDomain } = require('../../utils/universityEmail');
const logger = require('../../utils/logger');
const AppError = require('../../utils/AppError');
const { hashPassword, comparePassword, generateOtp } = require('../../utils/hash');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../../utils/jwt');
const bcrypt = require('bcrypt');

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** OTP validity — stored in MySQL via DATE_ADD(NOW(), INTERVAL 5 MINUTE) to avoid Node vs MySQL clock/timezone skew. */
const OTP_INTERVAL_SQL = 'DATE_ADD(NOW(), INTERVAL 5 MINUTE)';

/**
 * 201 response body for POST /auth/register.
 * NOTE: `otp` is included only when MAIL_DEV=true (demo/development); never in production.
 */
function buildRegisterResponse({ userId, resent, otp }) {
  const isDev = process.env.MAIL_DEV === 'true' || process.env.MAIL_DEV === '1';
  return {
    message: 'OTP sent',
    devMode: isDev,
    userId,
    ...(resent ? { resent: true } : {}),
    // NOTE: OTP exposed only for demo/development purposes
    ...(isDev && { otp }),
  };
}

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    college: u.college,
    is_verified: !!u.is_verified,
    rating_avg: Number(u.rating_avg || 0),
    rating_count: u.rating_count,
    avatar_url: u.avatar_url || null,
  };
}

async function persistRefreshToken(conn, userId, token) {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await conn.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );
}

async function issueTokenPair(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistRefreshToken(pool, user.id, refreshToken);
  return { accessToken, refreshToken };
}

/**
 * Rate-limit OTP emails per user (rolling 1 hour window).
 */
async function assertOtpSendAllowed(connOrPool, userId) {
  const exec = connOrPool.query.bind(connOrPool);
  const [rows] = await exec(
    `SELECT COUNT(*) AS c FROM email_verifications
     WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
    [userId]
  );
  const count = Number(rows[0].c);
  if (count >= env.OTP_RESEND_LIMIT) {
    throw new AppError(
      429,
      'OTP_RATE_LIMIT',
      `Too many verification emails. Maximum ${env.OTP_RESEND_LIMIT} per hour. Try again later.`
    );
  }
}

async function dispatchOtpEmail(email, otp, recipientName) {
  try {
    await sendOTPEmail(email, otp, recipientName);
  } catch (err) {
    logger.error('[auth] Failed to send OTP email', {
      email,
      code: err.code,
      message: err.message,
    });
    throw new AppError(
      502,
      'EMAIL_SEND_FAILED',
      'Could not send verification email. Please try again in a few minutes.'
    );
  }
}

async function register({ name, email, password, college, phone }) {
  const emailNorm = String(email).trim().toLowerCase();
  if (!isAllowedUniversityDomain(emailNorm, env.ALLOWED_EMAIL_DOMAINS)) {
    throw new AppError(400, 'INVALID_UNIVERSITY_EMAIL', 'Only university emails are allowed.');
  }

  const otp = generateOtp(6);
  const otpHash = await bcrypt.hash(otp, 8);

  const [existing] = await pool.query('SELECT id, is_verified, name FROM users WHERE email = ?', [emailNorm]);
  if (existing.length > 0) {
    if (existing[0].is_verified) {
      throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
    }

    await assertOtpSendAllowed(pool, existing[0].id);

    await pool.query(
      'UPDATE email_verifications SET consumed = 1 WHERE user_id = ? AND consumed = 0',
      [existing[0].id]
    );
    await pool.query(
      `INSERT INTO email_verifications (user_id, otp_hash, expires_at) VALUES (?, ?, ${OTP_INTERVAL_SQL})`,
      [existing[0].id, otpHash]
    );

    const displayName = existing[0].name || name;
    await dispatchOtpEmail(emailNorm, otp, displayName);

    return buildRegisterResponse({ userId: existing[0].id, resent: true, otp });
  }

  const passwordHash = await hashPassword(password);

  const userId = await withTransaction(async (conn) => {
    const [r] = await conn.query(
      'INSERT INTO users (name, email, college, password_hash, phone, is_verified) VALUES (?, ?, ?, ?, ?, 0)',
      [name, emailNorm, college, passwordHash, phone || null]
    );
    const uid = r.insertId;

    await assertOtpSendAllowed(conn, uid);

    await conn.query(
      `INSERT INTO email_verifications (user_id, otp_hash, expires_at) VALUES (?, ?, ${OTP_INTERVAL_SQL})`,
      [uid, otpHash]
    );
    return uid;
  });

  await dispatchOtpEmail(emailNorm, otp, name);

  return buildRegisterResponse({ userId, otp });
}

async function verifyEmail({ userId, otp }) {
  const uid = Number(userId);
  const otpClean = String(otp || '').trim().replace(/\D/g, '');
  if (!Number.isFinite(uid) || uid < 1) {
    throw new AppError(400, 'INVALID_REQUEST', 'Invalid user id.');
  }
  if (otpClean.length !== 6) {
    throw new AppError(400, 'OTP_INVALID', 'OTP must be 6 digits.');
  }

  const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [uid]);
  if (users.length === 0) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
  }
  const user = users[0];
  if (user.is_verified) {
    throw new AppError(400, 'ALREADY_VERIFIED', 'Email already verified, please log in.');
  }

  const [rows] = await pool.query(
    `SELECT id, otp_hash, expires_at,
            (expires_at > NOW()) AS not_expired
     FROM email_verifications
     WHERE user_id = ? AND consumed = 0
     ORDER BY id DESC LIMIT 1`,
    [uid]
  );

  if (env.DEBUG_OTP || env.MAIL_DEV) {
    const [nowRows] = await pool.query('SELECT NOW() AS server_now');
    logger.info('[auth][verify-otp-debug]', {
      userId: uid,
      pendingRowCount: rows.length,
      expiresAt: rows[0]?.expires_at,
      notExpiredFlag: rows[0]?.not_expired,
      serverNow: nowRows[0]?.server_now,
    });
  }

  if (rows.length === 0) {
    throw new AppError(400, 'OTP_NOT_FOUND', 'No verification code pending. Register again or request a new code.');
  }

  const row = rows[0];
  if (!Number(row.not_expired)) {
    throw new AppError(400, 'OTP_EXPIRED', 'OTP has expired. Request a new verification code.');
  }

  const ok = await bcrypt.compare(otpClean, row.otp_hash);
  if (!ok) {
    throw new AppError(400, 'OTP_INVALID', 'Invalid OTP.');
  }

  await withTransaction(async (conn) => {
    await conn.query('UPDATE email_verifications SET consumed = 1 WHERE id = ?', [row.id]);
    await conn.query('UPDATE users SET is_verified = 1 WHERE id = ?', [uid]);
  });

  user.is_verified = 1;
  const tokens = await issueTokenPair(user);
  return { ...tokens, user: publicUser(user) };
}

async function login({ email, password }) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }
  const user = rows[0];
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }
  if (!user.is_verified) {
    throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email before logging in.', { userId: user.id });
  }

  const tokens = await issueTokenPair(user);
  return { ...tokens, user: publicUser(user) };
}

async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
  }

  const tokenHash = hashToken(refreshToken);
  const [rows] = await pool.query(
    'SELECT id, user_id, revoked, expires_at FROM refresh_tokens WHERE token_hash = ?',
    [tokenHash]
  );
  if (rows.length === 0 || rows[0].revoked || new Date(rows[0].expires_at) < new Date()) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is no longer valid.');
  }

  const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.sub]);
  if (users.length === 0) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'User not found.');
  const user = users[0];

  await withTransaction(async (conn) => {
    await conn.query('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [rows[0].id]);
  });

  const newAccess = signAccessToken(user);
  const newRefresh = signRefreshToken(user);
  await persistRefreshToken(pool, user.id, newRefresh);
  return { accessToken: newAccess, refreshToken: newRefresh };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await pool.query('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHash]);
}

async function me(userId) {
  const [rows] = await pool.query(
    'SELECT id, name, email, college, is_verified, rating_avg, rating_count, avatar_url FROM users WHERE id = ?',
    [userId]
  );
  if (rows.length === 0) throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
  return publicUser(rows[0]);
}

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  me,
  publicUser,
};
