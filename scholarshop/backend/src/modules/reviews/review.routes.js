'use strict';

const express = require('express');
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { verifyJWT, requireVerified } = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const { pool, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');
const notificationService = require('../notifications/notification.service');

const router = express.Router();
router.use(verifyJWT, requireVerified);

const createSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

router.post('/', validate({ body: createSchema }), asyncHandler(async (req, res) => {
  const { orderId, rating, comment } = req.body;
  const reviewerId = req.user.id;

  const [orders] = await pool.query(
    'SELECT id, buyer_id, seller_id, product_id, status FROM orders WHERE id = ?',
    [orderId]
  );
  if (orders.length === 0) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found.');
  const o = orders[0];
  if (Number(o.buyer_id) !== Number(reviewerId)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the buyer can review this order.');
  }
  if (o.status !== 'completed') {
    throw new AppError(400, 'ORDER_NOT_COMPLETED', 'Order must be completed before reviewing.');
  }

  await withTransaction(async (conn) => {
    try {
      await conn.query(
        `INSERT INTO reviews (reviewer_id, reviewee_id, product_id, order_id, rating, comment)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [reviewerId, o.seller_id, o.product_id, orderId, rating, comment || null]
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError(409, 'ALREADY_REVIEWED', 'You already reviewed this order.');
      }
      throw err;
    }
    await conn.query(
      `UPDATE users
       SET rating_avg = ((rating_avg * rating_count) + ?) / (rating_count + 1),
           rating_count = rating_count + 1
       WHERE id = ?`,
      [rating, o.seller_id]
    );
  });

  await notificationService.notify(req.app.get('io'), {
    userId: o.seller_id,
    type: 'review',
    payload: { orderId, productId: o.product_id, rating },
  });

  res.status(201).json({ ok: true });
}));

router.get('/user/:userId', asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, r.product_id,
            u.id AS reviewer_id, u.name AS reviewer_name,
            p.title AS product_title
     FROM reviews r
     JOIN users u ON u.id = r.reviewer_id
     JOIN products p ON p.id = r.product_id
     WHERE r.reviewee_id = ?
     ORDER BY r.created_at DESC
     LIMIT 50`,
    [userId]
  );
  res.json({
    items: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      product: { id: r.product_id, title: r.product_title },
      reviewer: { id: r.reviewer_id, name: r.reviewer_name },
    })),
  });
}));

router.get('/product/:productId', asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId);
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at,
            u.id AS reviewer_id, u.name AS reviewer_name
     FROM reviews r
     JOIN users u ON u.id = r.reviewer_id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC
     LIMIT 30`,
    [productId]
  );
  res.json({
    items: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      reviewer: { id: r.reviewer_id, name: r.reviewer_name },
    })),
  });
}));

module.exports = router;
