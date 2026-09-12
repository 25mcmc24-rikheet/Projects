import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import { wishlistApi } from '../api/wishlist';
import { reviewsApi } from '../api/reviews';
import { ordersApi } from '../api/orders';
import { chatApi } from '../api/chat';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/layout/Loader.jsx';
import ImageGallery from '../components/product/ImageGallery.jsx';
import StarRating from '../components/review/StarRating.jsx';
import ReviewList from '../components/review/ReviewList.jsx';
import { formatCurrency, formatRelative } from '../utils/formatters';
import { apiError } from '../api/client';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const [rentRange, setRentRange] = useState({ from: '', to: '' });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const product = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.get(id),
  });

  const wishlist = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.list(),
    enabled: !!user,
  });

  const reviews = useQuery({
    queryKey: ['reviews', 'product', id],
    queryFn: () => reviewsApi.forProduct(id),
  });

  const inWishlist = wishlist.data?.items?.some((p) => Number(p.id) === Number(id));

  const toggleWishlist = useMutation({
    mutationFn: () => (inWishlist ? wishlistApi.remove(id) : wishlistApi.add(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
    onError: (err) => toast.error(apiError(err)),
  });

  const startChat = useMutation({
    mutationFn: () => chatApi.open(Number(id)),
    onSuccess: (c) => navigate(`/chat/${c.id}`),
    onError: (err) => toast.error(apiError(err)),
  });

  const placeOrder = useMutation({
    mutationFn: (body) => ordersApi.create(body),
    onSuccess: () => {
      toast.success('Order request sent! The seller will confirm.');
      qc.invalidateQueries({ queryKey: ['product', id] });
      navigate('/dashboard?tab=orders');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const reportMut = useMutation({
    mutationFn: () => productsApi.report(id, reportReason),
    onSuccess: (data) => {
      toast.success(data.hidden ? 'Reported. Listing has been hidden.' : 'Reported. Thanks for keeping ScholarShop safe.');
      setReportOpen(false); setReportReason('');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  if (product.isLoading) return <Loader />;
  if (product.isError) return <p className="text-center text-rose-600 py-12">Listing not available.</p>;

  const p = product.data;
  const isOwner = user && Number(user.id) === Number(p.seller.id);
  const isRent = p.listing_type === 'rent';

  const buy = () => {
    if (isRent) {
      if (!rentRange.from || !rentRange.to) return toast.error('Please choose rental dates.');
      placeOrder.mutate({ productId: Number(id), type: 'rent', rent_from: rentRange.from, rent_to: rentRange.to });
    } else {
      placeOrder.mutate({ productId: Number(id), type: 'sell' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImageGallery images={p.images} title={p.title} />

        <div>
          <div className="flex items-center gap-2">
            <span className={'badge ' + (isRent ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}>
              {isRent ? 'For rent' : 'For sale'}
            </span>
            <span className="badge bg-slate-100 text-slate-700 capitalize">{p.condition_tag?.replace('_', ' ')}</span>
            <span className="badge bg-slate-100 text-slate-700">{p.category}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-2">{p.title}</h1>
          <p className="text-3xl font-bold text-brand-700 mt-2">
            {formatCurrency(p.price)}
            {isRent && <span className="text-base text-slate-500 font-normal"> / {p.rent_unit}</span>}
          </p>
          <p className="text-sm text-slate-500 mt-1">{p.city} · {p.college} · posted {formatRelative(p.created_at)}</p>

          <div className="card p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Sold by</p>
                <p className="font-medium text-slate-900">{p.seller.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating value={p.seller.rating_avg} />
                  <span className="text-xs text-slate-500">{p.seller.rating_avg.toFixed(1)} ({p.seller.rating_count})</span>
                </div>
              </div>
              {!isOwner && (
                <button className="btn-secondary" onClick={() => startChat.mutate()}>
                  Chat with seller
                </button>
              )}
            </div>
          </div>

          {isRent && !isOwner && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="label">From</label>
                <input type="date" className="input" value={rentRange.from}
                       onChange={(e) => setRentRange((r) => ({ ...r, from: e.target.value }))} />
              </div>
              <div>
                <label className="label">To</label>
                <input type="date" className="input" value={rentRange.to}
                       onChange={(e) => setRentRange((r) => ({ ...r, to: e.target.value }))} />
              </div>
            </div>
          )}

          {!isOwner && (
            <div className="flex gap-2 mt-4">
              <button className="btn-primary flex-1" onClick={buy} disabled={placeOrder.isPending}>
                {placeOrder.isPending ? 'Sending…' : (isRent ? 'Request rental' : 'Buy now')}
              </button>
              <button className="btn-secondary" onClick={() => toggleWishlist.mutate()}>
                {inWishlist ? '♥ Saved' : '♡ Save'}
              </button>
              <button className="btn-ghost" onClick={() => setReportOpen(true)}>Report</button>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Description</h2>
            <p className="mt-2 text-slate-700 whitespace-pre-line">{p.description}</p>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Reviews</h2>
        <div className="card p-4">
          {reviews.isLoading ? <Loader /> : <ReviewList items={reviews.data?.items || []} />}
        </div>
      </section>

      {reportOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 grid place-items-center p-4">
          <div className="card p-6 w-full max-w-sm">
            <h3 className="font-semibold text-slate-900">Report this listing</h3>
            <p className="text-xs text-slate-500 mt-1">Listings auto-hide after multiple confirmed reports.</p>
            <textarea className="input mt-3 min-h-[80px]" placeholder="What's wrong with it?"
                      value={reportReason} onChange={(e) => setReportReason(e.target.value)} maxLength={255} />
            <div className="flex gap-2 justify-end mt-4">
              <button className="btn-ghost" onClick={() => setReportOpen(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => reportMut.mutate()}
                      disabled={!reportReason.trim() || reportMut.isPending}>Submit report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
