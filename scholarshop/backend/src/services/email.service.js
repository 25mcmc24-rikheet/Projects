'use strict';

const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (!env.SMTP_HOST) {
    const err = new Error('SMTP_HOST is not configured');
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }
  if (!transporter) {
    const port = Number(env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: port === 465,
      auth:
        env.SMTP_USER
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS != null ? String(env.SMTP_PASS) : '' }
          : undefined,
    });
  }
  return transporter;
}

function buildOtpHtml(otp, recipientName) {
  const greeting = recipientName ? `Hi ${escapeHtml(recipientName)},` : 'Hi,';
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
        <tr><td style="padding:28px;">
          <p style="margin:0;font-size:15px;color:#334155;">${greeting}</p>
          <p style="margin:16px 0 0 0;font-size:15px;color:#334155;">
            Your ScholarShop verification code:
          </p>
          <p style="margin:20px 0;font-size:28px;font-weight:700;letter-spacing:0.35em;color:#312e81;font-family:ui-monospace,Menlo,monospace;text-align:center;">
            ${escapeHtml(otp)}
          </p>
          <p style="margin:0;font-size:13px;color:#64748b;">This code expires in <strong>5 minutes</strong>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Send OTP via SMTP, or in MAIL_DEV mode log to console only (no external service).
 * @param {string} to
 * @param {string} otp
 * @param {string} [recipientName]
 */
async function sendOTPEmail(to, otp, recipientName = '') {
  if (env.MAIL_DEV) {
    console.log(`[DEV MODE] OTP for ${to} → ${otp}`);
    return { dev: true };
  }

  const transport = getTransporter();
  const info = await transport.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: 'Verify your ScholarShop account',
    html: buildOtpHtml(otp, recipientName),
    text: `Your ScholarShop verification code is ${otp}. It expires in 5 minutes.`,
  });

  logger.info(`[email] OTP email sent to ${to} messageId=${info.messageId}`);
  return info;
}

module.exports = {
  sendOTPEmail,
};
