'use strict';

const { pool, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');

function calcAmount(product, type, rent_from, rent_to) {
  if (type === 'sell') return Number(product.price);
  const start = new Date(rent_from);
  const end = new Date(rent_to);
  const ms = end - start;
  if (ms <= 0) throw new AppError(400, 'BAD_DATES', 'rent_to must be after rent_from.');
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  const unit = product.rent_unit || 'day';
  const factor =
    unit === 'hour'  ? days * 24 :
    unit === 'day'   ? days :
    unit === 'week'  ? Math.ceil(days / 7) :
    unit === 'month' ? Math.ceil(days / 30) : days;
  return Number(product.price) * factor;
}

async function createOrder({ buyerId, productId, type, rent_from, rent_to }) {
  const [products] = await pool.query(
    'SELECT id, seller_id, price, rent_unit, listing_type, status FROM products WHERE id = ?',
    [productId]
  );
  if (products.length === 0) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  const p = products[0];
  if (p.status !== 'active') throw new AppError(400, 'PRODUCT_UNAVAILABLE', 'Product is not available.');
  if (Number(p.seller_id) === Number(buyerId)) {
    throw new AppError(400, 'CANNOT_ORDER_OWN', 'You cannot order your own listing.');
  }
  if (type !== p.listing_type) {
    throw new AppError(400, 'TYPE_MISMATCH', `This listing is for ${p.listing_type}.`);
  }

  const amount = calcAmount(p, type, rent_from, rent_to);

  const id = await withTransaction(async (conn) => {
    const [r] = await conn.query(
      `INSERT INTO orders (product_id, buyer_id, seller_id, type, amount, rent_from, rent_to, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [productId, buyerId, p.seller_id, type, amount, rent_from || null, rent_to || null]
    );
    return r.insertId;
  });

  return { id, sellerId: p.seller_id };
}

async function listMine(userId, role) {
  const col = role === 'seller' ? 'o.seller_id' : 'o.buyer_id';
  const [rows] = await pool.query(
    `SELECT o.id, o.product_id, o.buyer_id, o.seller_id, o.type, o.amount, o.rent_from, o.rent_to, o.status, o.created_at,
            p.title AS product_title, p.listing_type AS product_type,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) AS thumbnail,
            ub.name AS buyer_name, us.name AS seller_name
     FROM orders o
     JOIN products p ON p.id = o.product_id
     JOIN users ub ON ub.id = o.buyer_id
     JOIN users us ON us.id = o.seller_id
     WHERE ${col} = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    rent_from: r.rent_from,
    rent_to: r.rent_to,
    status: r.status,
    created_at: r.created_at,
    product: { id: r.product_id, title: r.product_title, listing_type: r.product_type, thumbnail: r.thumbnail },
    buyer: { id: r.buyer_id, name: r.buyer_name },
    seller: { id: r.seller_id, name: r.seller_name },
  }));
}

async function updateStatus(orderId, userId, status) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (rows.length === 0) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found.');
  const o = rows[0];

  const isSeller = Number(o.seller_id) === Number(userId);
  const isBuyer = Number(o.buyer_id) === Number(userId);
  if (!isSeller && !isBuyer) throw new AppError(403, 'FORBIDDEN', 'You cannot modify this order.');

  if (status === 'cancelled' && o.status !== 'pending' && o.status !== 'confirmed') {
    throw new AppError(400, 'BAD_TRANSITION', 'Order cannot be cancelled now.');
  }
  if (status === 'confirmed' && (!isSeller || o.status !== 'pending')) {
    throw new AppError(400, 'BAD_TRANSITION', 'Only the seller can confirm a pending order.');
  }
  if (status === 'completed' && (!isSeller || (o.status !== 'confirmed' && o.status !== 'pending'))) {
    throw new AppError(400, 'BAD_TRANSITION', 'Only the seller can complete a confirmed order.');
  }

  await withTransaction(async (conn) => {
    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    if (status === 'completed') {
      const newProductStatus = o.type === 'sell' ? 'sold' : 'rented';
      await conn.query('UPDATE products SET status = ? WHERE id = ?', [newProductStatus, o.product_id]);
    }
  });

  return { ...o, status, isSeller, isBuyer };
}

module.exports = { createOrder, listMine, updateStatus };
