'use strict';

const chatService = require('../modules/chat/chat.service');
const notificationService = require('../modules/notifications/notification.service');
const logger = require('../utils/logger');

function conversationRoom(id) { return `conversation:${id}`; }
function userRoom(id) { return `user:${id}`; }

module.exports = function registerChatHandlers(io, socket) {
  socket.on('conversation:join', async ({ conversationId }, ack) => {
    try {
      const c = await chatService.getConversation(Number(conversationId), socket.user.id);
      socket.join(conversationRoom(c.id));
      if (typeof ack === 'function') ack({ ok: true });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, error: err.message });
    }
  });

  socket.on('conversation:leave', ({ conversationId }) => {
    socket.leave(conversationRoom(Number(conversationId)));
  });

  socket.on('message:send', async ({ conversationId, body }, ack) => {
    try {
      const trimmed = String(body || '').trim();
      if (!trimmed) throw new Error('Empty message');
      if (trimmed.length > 5000) throw new Error('Message too long');

      const { id, otherUserId } = await chatService.persistMessage({
        conversationId: Number(conversationId),
        senderId: socket.user.id,
        body: trimmed,
      });

      const message = {
        id,
        conversation_id: Number(conversationId),
        sender_id: socket.user.id,
        sender_name: socket.user.name,
        body: trimmed,
        created_at: new Date().toISOString(),
        read_at: null,
      };

      io.to(conversationRoom(conversationId)).emit('message:new', message);

      // Always notify the other user (for unread badge / live notifications dropdown).
      await notificationService.notify(io, {
        userId: otherUserId,
        type: 'message',
        payload: {
          conversationId: Number(conversationId),
          messageId: id,
          fromUserId: socket.user.id,
          fromName: socket.user.name,
          preview: trimmed.slice(0, 80),
        },
      });

      if (typeof ack === 'function') ack({ ok: true, message });
    } catch (err) {
      logger.warn('message:send failed', err.message);
      if (typeof ack === 'function') ack({ ok: false, error: err.message });
    }
  });

  socket.on('message:read', async ({ conversationId }) => {
    try {
      await chatService.markRead({ conversationId: Number(conversationId), userId: socket.user.id });
      io.to(conversationRoom(conversationId)).emit('message:read', {
        conversationId: Number(conversationId),
        readerId: socket.user.id,
        at: new Date().toISOString(),
      });
    } catch (err) {
      logger.warn('message:read failed', err.message);
    }
  });

  socket.on('typing:start', ({ conversationId }) => {
    socket.to(conversationRoom(Number(conversationId))).emit('typing:start', {
      conversationId: Number(conversationId),
      userId: socket.user.id,
    });
  });

  socket.on('typing:stop', ({ conversationId }) => {
    socket.to(conversationRoom(Number(conversationId))).emit('typing:stop', {
      conversationId: Number(conversationId),
      userId: socket.user.id,
    });
  });
};
