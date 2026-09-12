import React from 'react';

export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-3 text-slate-500">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
        <span>{label}</span>
      </div>
    </div>
  );
}
