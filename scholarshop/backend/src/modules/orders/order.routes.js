'use strict';

const express = require('express');
const validate = require('../../middleware/validate');
const { verifyJWT, requireVerified } = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const service = require('./order.service');
const schemas = require('./order.schemas');
const notificationService = require('../notifications/notification.service');

const router = express.Router();
router.use(verifyJWT, requireVerified);

router.post('/', validate({ body: schemas.createSchema }), asyncHandler(async (req, res) => {
  const { id, sellerId } = await service.createOrder({ buyerId: req.user.id, ...req.body });
  await notificationService.notify(req.app.get('io'), {
    userId: sellerId,
    type: 'order',
    payload: { orderId: id, productId: req.body.productId, kind: 'new', buyerName: req.user.name },
  });
  res.status(201).json({ id });
}));

router.get('/me', validate({ query: schemas.listQuery }), asyncHandler(async (req, res) => {
  const items = await service.listMine(req.user.id, req.query.role);
  res.json({ items });
}));

router.patch('/:id/status', validate({ body: schemas.statusSchema }), asyncHandler(async (req, res) => {
  const updated = await service.updateStatus(req.params.id, req.user.id, req.body.status);
  const otherUserId = updated.isSeller ? updated.buyer_id : updated.seller_id;
  await notificationService.notify(req.app.get('io'), {
    userId: otherUserId,
    type: 'order',
    payload: { orderId: updated.id, productId: updated.product_id, kind: 'status', status: updated.status },
  });
  res.json({ ok: true, status: updated.status });
}));

module.exports = router;
