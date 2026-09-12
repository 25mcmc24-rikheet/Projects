'use strict';

const { Server } = require('socket.io');
const env = require('../config/env');
const { verifyAccessToken } = require('../utils/jwt');
const { pool } = require('../config/db');
const logger = require('../utils/logger');
const registerChatHandlers = require('./chat.handler');

function userRoom(userId) { return `user:${userId}`; }

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
    pingTimeout: 30_000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('UNAUTHENTICATED'));
      const decoded = verifyAccessToken(token);
      const [rows] = await pool.query(
        'SELECT id, name, email, is_verified FROM users WHERE id = ? LIMIT 1',
        [decoded.sub]
      );
      if (rows.length === 0 || !rows[0].is_verified) return next(new Error('UNAUTHENTICATED'));
      socket.user = rows[0];
      next();
    } catch {
      next(new Error('UNAUTHENTICATED'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(userRoom(socket.user.id));
    logger.info(`socket connect user=${socket.user.id} sid=${socket.id}`);

    registerChatHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`socket disconnect user=${socket.user.id} sid=${socket.id} reason=${reason}`);
    });
  });

  return io;
}

module.exports = { initSocket, userRoom };
