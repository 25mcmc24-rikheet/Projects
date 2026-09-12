import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';
import { notificationsApi } from '../api/notifications';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationsApi.list({ limit: 30 });
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!socket) return;
    const handler = (n) => {
      setItems((prev) => [n, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
    };
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket]);

  const markRead = async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await notificationsApi.markRead(id); } catch {}
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    setUnreadCount(0);
    try { await notificationsApi.markAllRead(); } catch {}
  };

  return (
    <NotificationContext.Provider value={{ items, unreadCount, markRead, markAllRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
