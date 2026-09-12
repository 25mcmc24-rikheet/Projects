import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import ProductGrid from '../components/product/ProductGrid.jsx';
import Loader from '../components/layout/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CATEGORIES = [
  { id: 'books',       label: 'Books',       emoji: '📚' },
  { id: 'electronics', label: 'Electronics', emoji: '💻' },
  { id: 'transport',   label: 'Transport',   emoji: '🚲' },
  { id: 'home',        label: 'Home',        emoji: '🛏' },
  { id: 'stationery',  label: 'Stationery',  emoji: '✏️' },
  { id: 'sports',      label: 'Sports',      emoji: '🏸' },
];

export default function HomePage() {
  const { user } = useAuth();
  const recent = useQuery({
    queryKey: ['products', { sort: 'recent', limit: 8 }],
    queryFn: () => productsApi.list({ sort: 'recent', limit: 8 }),
    enabled: !!user,
  });
  const rents = useQuery({
    queryKey: ['products', { listing_type: 'rent', limit: 4 }],
    queryFn: () => productsApi.list({ listing_type: 'rent', limit: 4 }),
    enabled: !!user,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white p-8 sm:p-12">
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Buy. Sell. Rent. <span className="text-brand-100">On campus.</span></h1>
        <p className="mt-2 text-brand-100 max-w-xl">A trusted marketplace, exclusively for verified college students.</p>
        <div className="mt-6 flex gap-3">
          <Link to="/listings" className="bg-white text-brand-700 hover:bg-brand-50 btn">Browse listings</Link>
          {user
            ? <Link to="/sell" className="border border-white/40 text-white hover:bg-white/10 btn">Post a listing</Link>
            : <Link to="/register" className="border border-white/40 text-white hover:bg-white/10 btn">Sign up free</Link>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Browse by category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/listings?category=${c.id}`} className="card p-4 text-center hover:shadow-md transition">
              <div className="text-2xl">{c.emoji}</div>
              <div className="mt-1 text-sm font-medium">{c.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {user ? (
        <>
          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Recently posted</h2>
              <Link to="/listings" className="text-sm text-brand-700 hover:underline">See all →</Link>
            </div>
            {recent.isLoading ? <Loader /> : <ProductGrid items={recent.data?.items || []} />}
          </section>

          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Available for rent</h2>
              <Link to="/listings?listing_type=rent" className="text-sm text-brand-700 hover:underline">See all →</Link>
            </div>
            {rents.isLoading ? <Loader /> : <ProductGrid items={rents.data?.items || []} emptyText="No rentals right now." />}
          </section>
        </>
      ) : (
        <section className="card p-6 text-center">
          <h3 className="text-lg font-semibold text-slate-900">Login to see listings</h3>
          <p className="text-slate-500 text-sm mt-1">ScholarShop is for verified students only. <Link to="/login" className="text-brand-700 hover:underline">Login</Link> or <Link to="/register" className="text-brand-700 hover:underline">create an account</Link>.</p>
        </section>
      )}
    </div>
  );
}
