'use strict';

const { pool } = require('../../config/db');
const { userRoom } = require('../../sockets');
const logger = require('../../utils/logger');

async function notify(io, { userId, type, payload }) {
  try {
    const [r] = await pool.query(
      'INSERT INTO notifications (user_id, type, payload) VALUES (?, ?, ?)',
      [userId, type, JSON.stringify(payload || {})]
    );
    const notification = {
      id: r.insertId,
      user_id: userId,
      type,
      payload,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    if (io) {
      io.to(userRoom(userId)).emit('notification:new', notification);
    }
    return notification;
  } catch (err) {
    logger.error('notify failed', err);
  }
}

async function listMine(userId, { unread = false, limit = 30 } = {}) {
  let sql = 'SELECT id, type, payload, read_at, created_at FROM notifications WHERE user_id = ?';
  const params = [userId];
  if (unread) sql += ' AND read_at IS NULL';
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(Number(limit));
  const [rows] = await pool.query(sql, params);
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
    read_at: r.read_at,
    created_at: r.created_at,
  }));
}

async function markRead(userId, id) {
  await pool.query('UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND id = ? AND read_at IS NULL', [userId, id]);
}

async function markAllRead(userId) {
  await pool.query('UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL', [userId]);
}

async function unreadCount(userId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL',
    [userId]
  );
  return rows[0].c;
}

module.exports = { notify, listMine, markRead, markAllRead, unreadCount };
