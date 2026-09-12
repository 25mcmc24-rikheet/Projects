import React, { useEffect, useRef, useState } from 'react';

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimer = useRef(null);

  useEffect(() => () => { if (typingTimer.current) clearTimeout(typingTimer.current); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onSend(body);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const onChange = (e) => {
    setText(e.target.value);
    if (onTyping) {
      onTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => onTyping(false), 1500);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 bg-white p-3">
      <input
        type="text"
        className="input"
        placeholder="Type a message…"
        value={text}
        onChange={onChange}
        maxLength={5000}
      />
      <button type="submit" className="btn-primary" disabled={!text.trim() || sending}>
        {sending ? '…' : 'Send'}
      </button>
    </form>
  );
}
