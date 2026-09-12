'use strict';

require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('scholarshop'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  /** When true: OTP is printed to console; register JSON includes `otp` for demo. No SMTP required. */
  MAIL_DEV: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('ScholarShop <no-reply@localhost>'),

  /** Max OTP emails per user per rolling hour */
  OTP_RESEND_LIMIT: z.coerce.number().int().min(1).max(50).default(5),

  ALLOWED_EMAIL_DOMAINS: z
    .string()
    .default('example.edu')
    .transform((v) => v.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)),

  UPLOAD_DIR: z.string().default('uploads'),
  REPORT_HIDE_THRESHOLD: z.coerce.number().default(5),

  /** Log OTP verification debug lines (never logs plaintext OTP in production unless true) */
  DEBUG_OTP: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = parsed.data;
