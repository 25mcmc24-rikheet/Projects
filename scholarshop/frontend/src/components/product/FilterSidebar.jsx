import React from 'react';

const CATEGORIES = ['', 'books', 'electronics', 'transport', 'home', 'stationery', 'clothing', 'sports', 'other'];

export default function FilterSidebar({ filters, onChange }) {
  const set = (k, v) => onChange({ ...filters, [k]: v, page: 1 });

  return (
    <aside className="card p-4 space-y-4 sticky top-16">
      <div>
        <p className="label">Listing type</p>
        <div className="flex gap-2">
          {[
            { v: '', label: 'All' },
            { v: 'sell', label: 'Sell' },
            { v: 'rent', label: 'Rent' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              className={
                'flex-1 rounded-lg border px-2 py-1 text-sm ' +
                (filters.listing_type === o.v
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50')
              }
              onClick={() => set('listing_type', o.v)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="category">Category</label>
        <select id="category" className="input"
                value={filters.category || ''}
                onChange={(e) => set('category', e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c || 'all'} value={c}>{c ? c[0].toUpperCase() + c.slice(1) : 'All categories'}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="city">City</label>
        <input id="city" className="input" placeholder="Any city"
               value={filters.city || ''} onChange={(e) => set('city', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label" htmlFor="min">Min ₹</label>
          <input id="min" className="input" type="number" min={0}
                 value={filters.min ?? ''} onChange={(e) => set('min', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label" htmlFor="max">Max ₹</label>
          <input id="max" className="input" type="number" min={0}
                 value={filters.max ?? ''} onChange={(e) => set('max', e.target.value || undefined)} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="sort">Sort</label>
        <select id="sort" className="input"
                value={filters.sort || 'recent'}
                onChange={(e) => set('sort', e.target.value)}>
          <option value="recent">Most recent</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      <button type="button" className="btn-secondary w-full"
              onClick={() => onChange({ page: 1, limit: filters.limit, sort: 'recent' })}>
        Reset filters
      </button>
    </aside>
  );
}
