'use strict';

const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(190),
  password: z.string().min(8).max(128),
  college: z.string().trim().min(2).max(150),
  phone: z.string().trim().max(20).optional(),
});

const verifyEmailSchema = z.object({
  userId: z.coerce.number().int().positive(),
  otp: z
    .string()
    .transform((s) => String(s).trim().replace(/\D/g, ''))
    .pipe(z.string().length(6, 'OTP must be 6 digits')),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

module.exports = { registerSchema, verifyEmailSchema, loginSchema, refreshSchema };
