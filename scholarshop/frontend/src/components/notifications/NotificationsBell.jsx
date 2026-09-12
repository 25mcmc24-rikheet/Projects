import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { formatRelative } from '../../utils/formatters';

function describe(n) {
  const p = n.payload || {};
  switch (n.type) {
    case 'message': return `${p.fromName || 'Someone'}: ${p.preview || 'sent a message'}`;
    case 'order':
      if (p.kind === 'new') return `${p.buyerName || 'A student'} placed an order on your listing`;
      return `Order #${p.orderId} is now ${p.status || 'updated'}`;
    case 'review': return `New ${p.rating}-star review on your listing`;
    case 'listing_hidden': return `Your listing #${p.productId} was auto-hidden after multiple reports`;
    default: return n.type;
  }
}

function linkFor(n) {
  const p = n.payload || {};
  if (n.type === 'message' && p.conversationId) return `/chat/${p.conversationId}`;
  if (n.type === 'order') return '/dashboard?tab=orders';
  if (n.type === 'review' && p.productId) return `/listings/${p.productId}`;
  if (n.type === 'listing_hidden' && p.productId) return `/listings/${p.productId}`;
  return '#';
}

export default function NotificationsBell() {
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button className="btn-ghost relative" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-rose-600 text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto card p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-medium">Notifications</span>
            <button className="text-xs text-brand-700 hover:underline" onClick={markAllRead}>Mark all read</button>
          </div>
          {items.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">You're all caught up.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => (
                <li key={n.id} className={'px-2 py-2 text-sm ' + (n.read_at ? 'text-slate-500' : 'text-slate-900 bg-brand-50/40')}>
                  <Link
                    to={linkFor(n)}
                    onClick={() => { setOpen(false); if (!n.read_at) markRead(n.id); }}
                    className="block"
                  >
                    <p className="line-clamp-2">{describe(n)}</p>
                    <span className="text-[11px] text-slate-400">{formatRelative(n.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
