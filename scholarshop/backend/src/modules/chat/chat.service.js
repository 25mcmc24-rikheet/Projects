'use strict';

const { pool, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');

async function listMyConversations(userId) {
  const [rows] = await pool.query(
    `SELECT c.id, c.product_id, c.buyer_id, c.seller_id, c.last_message_at,
            p.title AS product_title,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) AS thumbnail,
            ub.name AS buyer_name, us.name AS seller_name,
            (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_body,
            (SELECT COUNT(*) FROM messages
              WHERE conversation_id = c.id AND read_at IS NULL AND sender_id <> ?) AS unread
     FROM conversations c
     JOIN products p ON p.id = c.product_id
     JOIN users ub ON ub.id = c.buyer_id
     JOIN users us ON us.id = c.seller_id
     WHERE c.buyer_id = ? OR c.seller_id = ?
     ORDER BY c.last_message_at IS NULL, c.last_message_at DESC, c.id DESC`,
    [userId, userId, userId]
  );
  return rows.map((r) => ({
    id: r.id,
    product: { id: r.product_id, title: r.product_title, thumbnail: r.thumbnail },
    buyer:   { id: r.buyer_id,  name: r.buyer_name },
    seller:  { id: r.seller_id, name: r.seller_name },
    last_message_at: r.last_message_at,
    last_body: r.last_body,
    unread: r.unread,
  }));
}

async function ensureConversation({ userId, productId }) {
  const [products] = await pool.query('SELECT id, seller_id FROM products WHERE id = ?', [productId]);
  if (products.length === 0) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  const sellerId = products[0].seller_id;
  if (Number(sellerId) === Number(userId)) {
    throw new AppError(400, 'CANNOT_CHAT_OWN', 'You cannot start a chat on your own listing.');
  }

  const [existing] = await pool.query(
    'SELECT id FROM conversations WHERE product_id = ? AND buyer_id = ? AND seller_id = ?',
    [productId, userId, sellerId]
  );
  if (existing.length > 0) return existing[0].id;

  const [r] = await pool.query(
    'INSERT INTO conversations (product_id, buyer_id, seller_id) VALUES (?, ?, ?)',
    [productId, userId, sellerId]
  );
  return r.insertId;
}

async function getConversation(conversationId, userId) {
  const [rows] = await pool.query(
    `SELECT c.id, c.product_id, c.buyer_id, c.seller_id, c.last_message_at,
            p.title AS product_title,
            (SELECT url FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) AS thumbnail,
            ub.name AS buyer_name, us.name AS seller_name
     FROM conversations c
     JOIN products p ON p.id = c.product_id
     JOIN users ub ON ub.id = c.buyer_id
     JOIN users us ON us.id = c.seller_id
     WHERE c.id = ?`,
    [conversationId]
  );
  if (rows.length === 0) throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  const c = rows[0];
  if (Number(c.buyer_id) !== Number(userId) && Number(c.seller_id) !== Number(userId)) {
    throw new AppError(403, 'FORBIDDEN', 'You are not a participant of this conversation.');
  }
  return {
    id: c.id,
    product: { id: c.product_id, title: c.product_title, thumbnail: c.thumbnail },
    buyer:   { id: c.buyer_id,  name: c.buyer_name },
    seller:  { id: c.seller_id, name: c.seller_name },
    last_message_at: c.last_message_at,
  };
}

async function listMessages(conversationId, userId, { before, limit = 30 }) {
  // Make sure caller is a participant
  await getConversation(conversationId, userId);

  const params = [conversationId];
  let cursor = '';
  if (before) {
    cursor = ' AND id < ?';
    params.push(Number(before));
  }
  params.push(Number(limit));

  const [rows] = await pool.query(
    `SELECT id, conversation_id, sender_id, body, read_at, created_at
     FROM messages
     WHERE conversation_id = ?${cursor}
     ORDER BY id DESC
     LIMIT ?`,
    params
  );
  return rows.reverse();
}

async function persistMessage({ conversationId, senderId, body }) {
  return withTransaction(async (conn) => {
    const [convs] = await conn.query(
      'SELECT id, buyer_id, seller_id FROM conversations WHERE id = ? FOR UPDATE',
      [conversationId]
    );
    if (convs.length === 0) throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
    const c = convs[0];
    if (Number(c.buyer_id) !== Number(senderId) && Number(c.seller_id) !== Number(senderId)) {
      throw new AppError(403, 'FORBIDDEN', 'You are not a participant of this conversation.');
    }
    const [r] = await conn.query(
      'INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)',
      [conversationId, senderId, body]
    );
    await conn.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [conversationId]);
    const otherUserId = Number(c.buyer_id) === Number(senderId) ? c.seller_id : c.buyer_id;
    return { id: r.insertId, otherUserId };
  });
}

async function markRead({ conversationId, userId }) {
  await pool.query(
    `UPDATE messages SET read_at = NOW()
     WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL`,
    [conversationId, userId]
  );
}

module.exports = {
  listMyConversations,
  ensureConversation,
  getConversation,
  listMessages,
  persistMessage,
  markRead,
};
