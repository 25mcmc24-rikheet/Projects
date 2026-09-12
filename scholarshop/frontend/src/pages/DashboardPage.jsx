import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import { ordersApi } from '../api/orders';
import { wishlistApi } from '../api/wishlist';
import { reviewsApi } from '../api/reviews';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/layout/Loader.jsx';
import ProductCard from '../components/product/ProductCard.jsx';
import StarRating from '../components/review/StarRating.jsx';
import { formatCurrency, formatRelative, imageUrl } from '../utils/formatters';
import { apiError } from '../api/client';

const TABS = [
  { id: 'listings',    label: 'My Listings' },
  { id: 'orders',      label: 'Orders' },
  { id: 'wishlist',    label: 'Wishlist' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'listings';
  const setTab = (t) => setParams({ tab: t }, { replace: true });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-100 grid place-items-center text-brand-700 font-semibold text-lg">
            {user?.name?.[0] || '?'}
          </div>
          <div>
            <p className="font-medium text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.college}</p>
            <div className="flex items-center gap-1 mt-1">
              <StarRating value={user?.rating_avg || 0} />
              <span className="text-xs text-slate-500">
                {user?.rating_avg ? Number(user.rating_avg).toFixed(1) : '—'} ({user?.rating_count || 0})
              </span>
            </div>
          </div>
          <Link to="/sell" className="btn-primary ml-auto">+ New listing</Link>
        </div>
      </div>

      <div className="border-b border-slate-200 flex gap-2 mb-4">
        {TABS.map((t) => (
          <button key={t.id}
                  className={'px-4 py-2 text-sm font-medium border-b-2 -mb-px ' +
                    (tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-600 hover:text-slate-900')}
                  onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'listings' && <MyListings userId={user?.id} />}
      {tab === 'orders' && <Orders />}
      {tab === 'wishlist' && <Wishlist />}
    </div>
  );
}

function MyListings({ userId }) {
  const qc = useQueryClient();
  const toast = useToast();
  const list = useQuery({
    queryKey: ['my-listings', userId],
    queryFn: () => productsApi.list({ seller_id: userId, limit: 50 }),
    enabled: !!userId,
  });

  const remove = useMutation({
    mutationFn: (id) => productsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-listings'] }); toast.success('Listing deleted.'); },
    onError: (err) => toast.error(apiError(err)),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }) => productsApi.patch(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-listings'] }),
    onError: (err) => toast.error(apiError(err)),
  });

  if (list.isLoading) return <Loader />;
  const items = list.data?.items || [];
  if (items.length === 0) return (
    <div className="card p-8 text-center">
      <p className="text-slate-500">You haven't posted anything yet.</p>
      <Link to="/sell" className="btn-primary mt-4 inline-block">Post your first listing</Link>
    </div>
  );

  return (
    <div className="space-y-3">
      {items.map((p) => (
        <div key={p.id} className="card p-3 flex gap-4 items-center">
          <Link to={`/listings/${p.id}`} className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden flex-none">
            {p.images?.[0]?.url ? <img src={imageUrl(p.images[0].url)} className="w-full h-full object-cover" alt="" /> : null}
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{p.title}</p>
            <p className="text-sm text-slate-500">{formatCurrency(p.price)}{p.listing_type === 'rent' && ` / ${p.rent_unit}`} · {p.status}</p>
            <p className="text-xs text-slate-400">posted {formatRelative(p.created_at)}</p>
          </div>
          <div className="flex flex-col gap-1">
            {p.status === 'active' && (
              <button className="btn-ghost text-xs"
                      onClick={() => setStatus.mutate({ id: p.id, status: p.listing_type === 'rent' ? 'rented' : 'sold' })}>
                Mark {p.listing_type === 'rent' ? 'rented' : 'sold'}
              </button>
            )}
            <button className="btn-ghost text-xs text-rose-600"
                    onClick={() => { if (confirm('Delete this listing?')) remove.mutate(p.id); }}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Orders() {
  const [role, setRole] = useState('buyer');
  const qc = useQueryClient();
  const toast = useToast();

  const orders = useQuery({
    queryKey: ['orders', role],
    queryFn: () => ordersApi.listMine(role),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }) => ordersApi.setStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Order updated.'); },
    onError: (err) => toast.error(apiError(err)),
  });

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {['buyer', 'seller'].map((r) => (
          <button key={r}
                  className={'btn ' + (role === r ? 'btn-primary' : 'btn-secondary')}
                  onClick={() => setRole(r)}>
            {r === 'buyer' ? 'I bought / rented' : 'I sold / rented out'}
          </button>
        ))}
      </div>

      {orders.isLoading ? <Loader /> : (
        (orders.data?.items || []).length === 0
          ? <p className="text-center text-slate-500 py-12">No orders yet.</p>
          : (
            <div className="space-y-3">
              {orders.data.items.map((o) => (
                <div key={o.id} className="card p-3 flex gap-4 items-center">
                  <Link to={`/listings/${o.product.id}`} className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-none">
                    {o.product.thumbnail && <img src={imageUrl(o.product.thumbnail)} className="w-full h-full object-cover" alt="" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{o.product.title}</p>
                    <p className="text-sm text-slate-500">
                      {role === 'buyer' ? `from ${o.seller.name}` : `to ${o.buyer.name}`} · {formatCurrency(o.amount)} · {o.type}
                    </p>
                    <p className="text-xs text-slate-400">status: <span className="font-medium text-slate-600">{o.status}</span></p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {role === 'seller' && o.status === 'pending' && (
                      <button className="btn-secondary text-xs"
                              onClick={() => setStatus.mutate({ id: o.id, status: 'confirmed' })}>Confirm</button>
                    )}
                    {role === 'seller' && (o.status === 'confirmed' || o.status === 'pending') && (
                      <button className="btn-primary text-xs"
                              onClick={() => setStatus.mutate({ id: o.id, status: 'completed' })}>Mark complete</button>
                    )}
                    {(o.status === 'pending' || o.status === 'confirmed') && (
                      <button className="btn-ghost text-xs text-rose-600"
                              onClick={() => setStatus.mutate({ id: o.id, status: 'cancelled' })}>Cancel</button>
                    )}
                    {role === 'buyer' && o.status === 'completed' && <ReviewControl orderId={o.id} />}
                  </div>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
}

function ReviewControl({ orderId }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const toast = useToast();
  const qc = useQueryClient();
  const submit = useMutation({
    mutationFn: () => reviewsApi.create({ orderId, rating, comment }),
    onSuccess: () => { toast.success('Review submitted!'); setOpen(false); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError: (err) => toast.error(apiError(err)),
  });
  if (!open) return <button className="btn-secondary text-xs" onClick={() => setOpen(true)}>Leave review</button>;
  return (
    <div className="bg-slate-50 rounded-lg p-2 w-64 space-y-2">
      <StarRating value={rating} onChange={setRating} />
      <textarea className="input text-sm" rows={2} value={comment}
                onChange={(e) => setComment(e.target.value)} placeholder="Optional comment" maxLength={1000} />
      <div className="flex justify-end gap-1">
        <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn-primary text-xs" onClick={() => submit.mutate()} disabled={submit.isPending}>Submit</button>
      </div>
    </div>
  );
}

function Wishlist() {
  const list = useQuery({ queryKey: ['wishlist'], queryFn: () => wishlistApi.list() });
  if (list.isLoading) return <Loader />;
  const items = list.data?.items || [];
  if (items.length === 0) return <p className="text-center text-slate-500 py-12">Your wishlist is empty.</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={{
          ...p,
          images: p.thumbnail ? [{ url: p.thumbnail }] : [],
          condition_tag: '',
          category: '',
          rent_unit: p.rent_unit,
        }} />
      ))}
    </div>
  );
}
