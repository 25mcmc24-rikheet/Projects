'use strict';

const express = require('express');
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { verifyJWT, requireVerified } = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const service = require('./chat.service');

const router = express.Router();
router.use(verifyJWT, requireVerified);

router.get('/', asyncHandler(async (req, res) => {
  const items = await service.listMyConversations(req.user.id);
  res.json({ items });
}));

router.post(
  '/',
  validate({ body: z.object({ productId: z.coerce.number().int().positive() }) }),
  asyncHandler(async (req, res) => {
    const id = await service.ensureConversation({ userId: req.user.id, productId: req.body.productId });
    const conversation = await service.getConversation(id, req.user.id);
    res.status(201).json(conversation);
  })
);

router.get('/:id', asyncHandler(async (req, res) => {
  const c = await service.getConversation(Number(req.params.id), req.user.id);
  res.json(c);
}));

router.get(
  '/:id/messages',
  validate({
    query: z.object({
      before: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).default(30),
    }),
  }),
  asyncHandler(async (req, res) => {
    const items = await service.listMessages(Number(req.params.id), req.user.id, req.query);
    res.json({ items });
  })
);

router.post('/:id/read', asyncHandler(async (req, res) => {
  await service.markRead({ conversationId: Number(req.params.id), userId: req.user.id });
  res.json({ ok: true });
}));

module.exports = router;
