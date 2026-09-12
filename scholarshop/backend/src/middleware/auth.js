'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const { pool } = require('../config/db');

async function verifyJWT(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Missing or malformed Authorization header.');
    }

    const decoded = verifyAccessToken(token);

    const [rows] = await pool.query(
      'SELECT id, name, email, college, is_verified, rating_avg, rating_count, avatar_url FROM users WHERE id = ? LIMIT 1',
      [decoded.sub]
    );
    if (rows.length === 0) {
      throw new AppError(401, 'UNAUTHENTICATED', 'User no longer exists.');
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired token.'));
    }
    next(err);
  }
}

function requireVerified(req, res, next) {
  if (!req.user || !req.user.is_verified) {
    return next(new AppError(403, 'EMAIL_NOT_VERIFIED', 'Verify your college email to continue.'));
  }
  next();
}

module.exports = { verifyJWT, requireVerified };
