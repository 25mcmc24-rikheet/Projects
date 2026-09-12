import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, imageUrl } from '../../utils/formatters';

export default function ProductCard({ product }) {
  const thumb = product.images?.[0]?.url || product.thumbnail;
  const isRent = product.listing_type === 'rent';
  return (
    <Link to={`/listings/${product.id}`} className="card overflow-hidden hover:shadow-md transition group">
      <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
        {thumb ? (
          <img src={imageUrl(thumb)} alt={product.title} loading="lazy"
               className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
        ) : (
          <div className="w-full h-full grid place-items-center text-slate-400 text-sm">No image</div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className={'badge ' + (isRent ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}>
            {isRent ? 'Rent' : 'Sell'}
          </span>
          {product.condition_tag && (
            <span className="badge bg-slate-100 text-slate-700 capitalize">{product.condition_tag.replace('_', ' ')}</span>
          )}
        </div>
        <h3 className="mt-2 font-medium text-slate-900 line-clamp-1">{product.title}</h3>
        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{product.city} · {product.category}</p>
        <p className="mt-2 text-brand-700 font-semibold">
          {formatCurrency(product.price)}{isRent && <span className="text-slate-500 text-xs font-normal"> / {product.rent_unit}</span>}
        </p>
      </div>
    </Link>
  );
}
