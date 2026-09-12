'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const service = require('./auth.service');

exports.register = asyncHandler(async (req, res) => {
  const result = await service.register(req.body);
  // When MAIL_DEV=true, response includes `otp` for demo UIs; omitted when MAIL_DEV=false.
  res.status(201).json(result);
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const result = await service.verifyEmail(req.body);
  res.json(result);
});

exports.login = asyncHandler(async (req, res) => {
  const result = await service.login(req.body);
  res.json(result);
});

exports.refresh = asyncHandler(async (req, res) => {
  const result = await service.refresh(req.body.refreshToken);
  res.json(result);
});

exports.logout = asyncHandler(async (req, res) => {
  await service.logout(req.body?.refreshToken);
  res.json({ ok: true });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await service.me(req.user.id);
  res.json({ user });
});
