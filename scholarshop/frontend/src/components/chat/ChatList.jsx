import React from 'react';
import { Link } from 'react-router-dom';
import { formatRelative, imageUrl } from '../../utils/formatters';

export default function ChatList({ items, activeId, currentUserId }) {
  if (!items || items.length === 0) {
    return <p className="text-center text-sm text-slate-500 py-12">No conversations yet.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((c) => {
        const other = Number(c.buyer.id) === Number(currentUserId) ? c.seller : c.buyer;
        const active = Number(c.id) === Number(activeId);
        return (
          <li key={c.id}>
            <Link to={`/chat/${c.id}`}
                  className={'flex gap-3 p-3 items-center hover:bg-slate-50 ' + (active ? 'bg-brand-50/40' : '')}>
              <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-none">
                {c.product.thumbnail && <img src={imageUrl(c.product.thumbnail)} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-medium text-slate-900 truncate">{other.name}</p>
                  {c.last_message_at && (
                    <span className="text-xs text-slate-400 flex-none ml-2">{formatRelative(c.last_message_at)}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{c.product.title}</p>
                <p className="text-sm text-slate-600 truncate">{c.last_body || 'Say hi!'}</p>
              </div>
              {c.unread > 0 && (
                <span className="badge bg-brand-600 text-white">{c.unread}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
