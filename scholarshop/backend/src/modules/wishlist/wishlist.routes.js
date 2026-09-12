'use strict';

const express = require('express');
const { verifyJWT, requireVerified } = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const { pool } = require('../../config/db');
const AppError = require('../../utils/AppError');

const router = express.Router();
router.use(verifyJWT, requireVerified);

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.id, p.title, p.price, p.listing_type, p.rent_unit, p.city, p.status,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) AS thumbnail,
            u.name AS seller_name, u.rating_avg AS seller_rating
     FROM wishlist w
     JOIN products p ON p.id = w.product_id
     JOIN users u ON u.id = p.seller_id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.json({
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      price: Number(r.price),
      listing_type: r.listing_type,
      rent_unit: r.rent_unit,
      city: r.city,
      status: r.status,
      thumbnail: r.thumbnail,
      seller: { name: r.seller_name, rating_avg: Number(r.seller_rating || 0) },
    })),
  });
}));

router.post('/:productId', asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId);
  if (!productId) throw new AppError(400, 'BAD_REQUEST', 'Invalid product id.');
  const [exists] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
  if (exists.length === 0) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  await pool.query(
    'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
    [req.user.id, productId]
  );
  res.json({ ok: true });
}));

router.delete('/:productId', asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId);
  await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
  res.json({ ok: true });
}));

module.exports = router;
