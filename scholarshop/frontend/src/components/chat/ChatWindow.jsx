import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../../api/chat';
import { useSocket } from '../../context/SocketContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import MessageBubble from './MessageBubble.jsx';
import MessageInput from './MessageInput.jsx';
import Loader from '../layout/Loader.jsx';
import { imageUrl } from '../../utils/formatters';

export default function ChatWindow({ conversationId }) {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const scrollerRef = useRef(null);

  const conversation = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatApi.get(conversationId),
    enabled: !!conversationId,
  });

  const history = useQuery({
    queryKey: ['conversation', conversationId, 'messages'],
    queryFn: () => chatApi.messages(conversationId, { limit: 50 }),
    enabled: !!conversationId,
  });

  useEffect(() => { setMessages(history.data?.items || []); }, [history.data, conversationId]);

  // Mark conversation as read on entry + scroll to bottom on changes
  useEffect(() => {
    if (!conversationId) return;
    chatApi.markRead(conversationId).catch(() => {});
  }, [conversationId, messages.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typing]);

  // Socket join + listeners
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('conversation:join', { conversationId });

    const onNew = (msg) => {
      if (Number(msg.conversation_id) !== Number(conversationId)) return;
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
      if (Number(msg.sender_id) !== Number(user.id)) {
        socket.emit('message:read', { conversationId });
      }
    };
    const onRead = ({ conversationId: c, readerId }) => {
      if (Number(c) !== Number(conversationId)) return;
      setMessages((prev) => prev.map((m) =>
        Number(m.sender_id) !== Number(readerId) ? { ...m, read_at: m.read_at || new Date().toISOString() } : m
      ));
    };
    const onTypingStart = ({ conversationId: c, userId }) => {
      if (Number(c) === Number(conversationId) && Number(userId) !== Number(user.id)) setTyping(true);
    };
    const onTypingStop = ({ conversationId: c, userId }) => {
      if (Number(c) === Number(conversationId) && Number(userId) !== Number(user.id)) setTyping(false);
    };

    socket.on('message:new', onNew);
    socket.on('message:read', onRead);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.emit('conversation:leave', { conversationId });
      socket.off('message:new', onNew);
      socket.off('message:read', onRead);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [socket, conversationId, user?.id]);

  const send = useCallback((body) => new Promise((resolve) => {
    if (!socket) return resolve();
    socket.emit('message:send', { conversationId, body }, (ack) => {
      if (ack?.ok && ack.message) {
        setMessages((prev) => prev.some((m) => m.id === ack.message.id) ? prev : [...prev, ack.message]);
      }
      resolve();
    });
  }), [socket, conversationId]);

  const onTyping = useCallback((isTyping) => {
    if (!socket) return;
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
  }, [socket, conversationId]);

  if (!conversationId) return null;
  if (conversation.isLoading) return <Loader />;
  if (conversation.isError) return <p className="text-center text-rose-600 py-12">Conversation not found.</p>;

  const c = conversation.data;
  const other = Number(c.buyer.id) === Number(user.id) ? c.seller : c.buyer;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-none">
          {c.product.thumbnail && <img src={imageUrl(c.product.thumbnail)} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate">{other.name}</p>
          <p className="text-xs text-slate-500 truncate">about: {c.product.title}</p>
        </div>
        <span className={'ml-auto inline-block w-2 h-2 rounded-full ' + (connected ? 'bg-emerald-500' : 'bg-slate-300')}
              title={connected ? 'Connected' : 'Disconnected'} />
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {history.isLoading ? <Loader /> : messages.map((m) => (
          <MessageBubble key={m.id} message={m} isMine={Number(m.sender_id) === Number(user.id)} />
        ))}
        {typing && (
          <p className="text-xs text-slate-400 italic">{other.name} is typing…</p>
        )}
      </div>

      <MessageInput onSend={send} onTyping={onTyping} />
    </div>
  );
}
