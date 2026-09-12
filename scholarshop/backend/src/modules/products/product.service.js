'use strict';

const { pool, withTransaction } = require('../../config/db');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');

const SAFE_FIELDS = `
  p.id, p.seller_id, p.title, p.description, p.category, p.listing_type,
  p.price, p.rent_unit, p.condition_tag, p.city, p.college, p.status,
  p.views, p.created_at
`;

async function attachImages(products) {
  if (products.length === 0) return products;
  const ids = products.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT product_id, url, position
     FROM product_images
     WHERE product_id IN (${placeholders})
     ORDER BY product_id ASC, position ASC, id ASC`,
    ids
  );
  const byProduct = new Map();
  for (const r of rows) {
    if (!byProduct.has(r.product_id)) byProduct.set(r.product_id, []);
    byProduct.get(r.product_id).push({ url: r.url, position: r.position });
  }
  for (const p of products) {
    p.images = byProduct.get(p.id) || [];
  }
  return products;
}

async function listProducts(q) {
  const where = ["p.status = 'active'"];
  const params = [];

  if (q.category) { where.push('p.category = ?'); params.push(q.category); }
  if (q.listing_type) { where.push('p.listing_type = ?'); params.push(q.listing_type); }
  if (q.city) { where.push('p.city = ?'); params.push(q.city); }
  if (q.college) { where.push('p.college = ?'); params.push(q.college); }
  if (q.min != null) { where.push('p.price >= ?'); params.push(q.min); }
  if (q.max != null) { where.push('p.price <= ?'); params.push(q.max); }
  if (q.seller_id) { where.push('p.seller_id = ?'); params.push(q.seller_id); }

  let order = 'p.created_at DESC, p.id DESC';
  if (q.sort === 'price_asc') order = 'p.price ASC';
  if (q.sort === 'price_desc') order = 'p.price DESC';

  if (q.search && q.search.length >= 3) {
    where.push('MATCH(p.title, p.description) AGAINST (? IN NATURAL LANGUAGE MODE)');
    params.push(q.search);
  } else if (q.search) {
    where.push('(p.title LIKE ? OR p.description LIKE ?)');
    params.push(`%${q.search}%`, `%${q.search}%`);
  }

  const offset = (q.page - 1) * q.limit;
  const sql = `
    SELECT ${SAFE_FIELDS},
      u.name AS seller_name, u.rating_avg AS seller_rating, u.rating_count AS seller_rating_count
    FROM products p
    JOIN users u ON u.id = p.seller_id
    WHERE ${where.join(' AND ')}
    ORDER BY ${order}
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(sql, [...params, q.limit, offset]);

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p WHERE ${where.join(' AND ')}`,
    params
  );

  await attachImages(rows);
  return {
    items: rows.map(serialize),
    page: q.page,
    limit: q.limit,
    total: countRows[0].total,
  };
}

function serialize(row) {
  return {
    id: row.id,
    seller: {
      id: row.seller_id,
      name: row.seller_name,
      rating_avg: Number(row.seller_rating || 0),
      rating_count: row.seller_rating_count,
    },
    title: row.title,
    description: row.description,
    category: row.category,
    listing_type: row.listing_type,
    price: Number(row.price),
    rent_unit: row.rent_unit,
    condition_tag: row.condition_tag,
    city: row.city,
    college: row.college,
    status: row.status,
    views: row.views,
    created_at: row.created_at,
    images: row.images || [],
  };
}

async function getById(id) {
  const [rows] = await pool.query(
    `SELECT ${SAFE_FIELDS},
            u.name AS seller_name, u.rating_avg AS seller_rating, u.rating_count AS seller_rating_count
     FROM products p
     JOIN users u ON u.id = p.seller_id
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  if (rows.length === 0) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  await attachImages(rows);
  await pool.query('UPDATE products SET views = views + 1 WHERE id = ?', [id]);
  return serialize(rows[0]);
}

async function create({ sellerId, sellerCollege, body, imageUrls }) {
  return withTransaction(async (conn) => {
    const [r] = await conn.query(
      `INSERT INTO products
       (seller_id, title, description, category, listing_type, price, rent_unit, condition_tag, city, college)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        body.title,
        body.description,
        body.category,
        body.listing_type,
        body.price,
        body.listing_type === 'rent' ? body.rent_unit : null,
        body.condition_tag,
        body.city,
        sellerCollege,
      ]
    );
    const productId = r.insertId;
    if (imageUrls && imageUrls.length > 0) {
      const values = imageUrls.map((url, i) => [productId, url, i]);
      await conn.query(
        'INSERT INTO product_images (product_id, url, position) VALUES ?',
        [values]
      );
    }
    return productId;
  }).then((id) => getById(id));
}

async function update(id, sellerId, patch) {
  const [rows] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [id]);
  if (rows.length === 0) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  if (Number(rows[0].seller_id) !== Number(sellerId)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the owner can update this listing.');
  }

  const fields = [];
  const params = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    fields.push(`${k} = ?`);
    params.push(v);
  }
  if (fields.length === 0) return getById(id);
  params.push(id);
  await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
  return getById(id);
}

async function remove(id, sellerId) {
  const [rows] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [id]);
  if (rows.length === 0) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  if (Number(rows[0].seller_id) !== Number(sellerId)) {
    throw new AppError(403, 'FORBIDDEN', 'Only the owner can delete this listing.');
  }
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
}

async function report({ productId, reporterId, reason }) {
  const [products] = await pool.query('SELECT id, seller_id, status FROM products WHERE id = ?', [productId]);
  if (products.length === 0) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  if (Number(products[0].seller_id) === Number(reporterId)) {
    throw new AppError(400, 'CANNOT_REPORT_OWN', 'You cannot report your own listing.');
  }

  try {
    await pool.query(
      'INSERT INTO reports (reporter_id, product_id, reason) VALUES (?, ?, ?)',
      [reporterId, productId, reason]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'ALREADY_REPORTED', 'You already reported this listing.');
    }
    throw err;
  }

  const [counts] = await pool.query('SELECT COUNT(*) AS c FROM reports WHERE product_id = ?', [productId]);
  let hidden = false;
  if (counts[0].c >= env.REPORT_HIDE_THRESHOLD && products[0].status !== 'hidden') {
    await pool.query("UPDATE products SET status = 'hidden' WHERE id = ?", [productId]);
    hidden = true;
  }
  return { reportCount: counts[0].c, hidden, sellerId: products[0].seller_id };
}

module.exports = {
  listProducts,
  getById,
  create,
  update,
  remove,
  report,
};
