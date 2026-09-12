import React from 'react';
import StarRating from './StarRating.jsx';
import { formatRelative } from '../../utils/formatters';

export default function ReviewList({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500">No reviews yet.</p>;
  }
  return (
    <ul className="space-y-4">
      {items.map((r) => (
        <li key={r.id} className="border-b border-slate-100 pb-4 last:border-b-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{r.reviewer.name}</p>
              <StarRating value={r.rating} />
            </div>
            <span className="text-xs text-slate-400">{formatRelative(r.created_at)}</span>
          </div>
          {r.comment && <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{r.comment}</p>}
        </li>
      ))}
    </ul>
  );
}
