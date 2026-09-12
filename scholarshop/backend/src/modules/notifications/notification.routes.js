'use strict';

const express = require('express');
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { verifyJWT, requireVerified } = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const service = require('./notification.service');

const router = express.Router();
router.use(verifyJWT, requireVerified);

router.get(
  '/',
  validate({
    query: z.object({
      unread: z.enum(['true', 'false']).optional(),
      limit: z.coerce.number().int().positive().max(100).default(30),
    }),
  }),
  asyncHandler(async (req, res) => {
    const items = await service.listMine(req.user.id, {
      unread: req.query.unread === 'true',
      limit: req.query.limit,
    });
    const unreadCount = await service.unreadCount(req.user.id);
    res.json({ items, unreadCount });
  })
);

router.patch('/read-all', asyncHandler(async (req, res) => {
  await service.markAllRead(req.user.id);
  res.json({ ok: true });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  await service.markRead(req.user.id, Number(req.params.id));
  res.json({ ok: true });
}));

module.exports = router;
