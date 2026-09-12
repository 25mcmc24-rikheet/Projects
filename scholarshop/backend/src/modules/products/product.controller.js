'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const service = require('./product.service');
const { publicUrlFor } = require('../../config/storage');
const notificationService = require('../notifications/notification.service');

exports.list = asyncHandler(async (req, res) => {
  const data = await service.listProducts(req.query);
  res.json(data);
});

exports.getOne = asyncHandler(async (req, res) => {
  const product = await service.getById(req.params.id);
  res.json(product);
});

exports.create = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const imageUrls = files.map((f) => publicUrlFor(f.filename));
  const product = await service.create({
    sellerId: req.user.id,
    sellerCollege: req.user.college,
    body: req.body,
    imageUrls,
  });
  res.status(201).json(product);
});

exports.update = asyncHandler(async (req, res) => {
  const product = await service.update(req.params.id, req.user.id, req.body);
  res.json(product);
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id, req.user.id);
  res.json({ ok: true });
});

exports.report = asyncHandler(async (req, res) => {
  const result = await service.report({
    productId: req.params.id,
    reporterId: req.user.id,
    reason: req.body.reason,
  });
  if (result.hidden) {
    await notificationService.notify(req.app.get('io'), {
      userId: result.sellerId,
      type: 'listing_hidden',
      payload: { productId: Number(req.params.id), reason: 'auto_hidden_by_reports' },
    });
  }
  res.json({ ok: true, hidden: result.hidden });
});
