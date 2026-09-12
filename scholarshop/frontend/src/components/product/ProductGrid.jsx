import React from 'react';
import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ items, emptyText = 'No listings yet.' }) {
  if (!items || items.length === 0) {
    return <p className="text-center text-slate-500 py-12">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
