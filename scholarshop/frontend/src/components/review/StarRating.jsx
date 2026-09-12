import React from 'react';

export default function StarRating({ value = 0, max = 5, size = 'sm', onChange }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const cls = size === 'lg' ? 'text-2xl' : 'text-base';
  return (
    <div className={'inline-flex items-center gap-0.5 ' + cls}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(s)}
          className={(s <= Math.round(value) ? 'text-amber-400' : 'text-slate-300') + (onChange ? ' hover:text-amber-500' : '')}
          aria-label={`${s} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
