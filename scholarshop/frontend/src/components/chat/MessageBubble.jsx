import React from 'react';
import { formatRelative } from '../../utils/formatters';

export default function MessageBubble({ message, isMine }) {
  return (
    <div className={'flex ' + (isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={
          'max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ' +
          (isMine ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white text-slate-800 ring-1 ring-slate-200 rounded-bl-sm')
        }
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p className={'text-[10px] mt-1 ' + (isMine ? 'text-brand-100/80' : 'text-slate-400')}>
          {formatRelative(message.created_at)}
          {isMine && message.read_at ? ' · seen' : ''}
        </p>
      </div>
    </div>
  );
}
