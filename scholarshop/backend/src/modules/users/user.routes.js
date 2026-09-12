'use strict';

const express = require('express');
const { verifyJWT, requireVerified } = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const { pool } = require('../../config/db');
const AppError = require('../../utils/AppError');

const router = express.Router();
router.use(verifyJWT, requireVerified);

router.get('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await pool.query(
    'SELECT id, name, college, rating_avg, rating_count, avatar_url, created_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  if (rows.length === 0) throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
  const u = rows[0];
  res.json({
    id: u.id,
    name: u.name,
    college: u.college,
    rating_avg: Number(u.rating_avg || 0),
    rating_count: u.rating_count,
    avatar_url: u.avatar_url,
    created_at: u.created_at,
  });
}));

module.exports = router;
