import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import { useToast } from '../context/ToastContext.jsx';
import { apiError } from '../api/client';

const CATEGORIES = ['books', 'electronics', 'transport', 'home', 'stationery', 'clothing', 'sports', 'other'];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: '', description: '', category: 'books',
    listing_type: 'sell', price: '',
    rent_unit: 'day', condition_tag: 'good',
    city: '',
  });
  const [files, setFiles] = useState([]);
  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const previews = files.map((f) => URL.createObjectURL(f));

  const create = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'rent_unit' && form.listing_type !== 'rent') return;
        if (v !== '' && v != null) fd.append(k, v);
      });
      files.forEach((f) => fd.append('images', f));
      return productsApi.create(fd);
    },
    onSuccess: (p) => {
      toast.success('Listing posted!');
      qc.invalidateQueries({ queryKey: ['products'] });
      navigate(`/listings/${p.id}`);
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.city || !form.price) {
      return toast.error('Please fill in all required fields.');
    }
    create.mutate();
  };

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []).slice(0, 5);
    const valid = picked.filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (valid.length < picked.length) toast.error('Some files were rejected (must be images <= 5MB).');
    setFiles(valid);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Post a listing</h1>
      <p className="text-slate-500 text-sm mt-1">Sell or rent something to verified students nearby.</p>

      <form className="card p-6 mt-6 space-y-4" onSubmit={submit}>
        <div>
          <label className="label">Listing type</label>
          <div className="flex gap-2">
            {['sell', 'rent'].map((t) => (
              <button key={t} type="button"
                      className={'btn flex-1 ' + (form.listing_type === t ? 'btn-primary' : 'btn-secondary')}
                      onClick={() => setForm((s) => ({ ...s, listing_type: t }))}>
                {t === 'sell' ? 'Sell' : 'Rent'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Title</label>
          <input className="input" required minLength={3} maxLength={200}
                 value={form.title} onChange={update('title')} placeholder="What are you posting?" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[120px]" required minLength={10} maxLength={5000}
                    value={form.description} onChange={update('description')} placeholder="Be specific — condition, brand, accessories…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={update('category')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Condition</label>
            <select className="input" value={form.condition_tag} onChange={update('condition_tag')}>
              <option value="new">New</option>
              <option value="like_new">Like new</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{form.listing_type === 'rent' ? 'Rent (₹)' : 'Price (₹)'}</label>
            <input type="number" min={0} className="input" required
                   value={form.price} onChange={update('price')} placeholder="0" />
          </div>
          {form.listing_type === 'rent' && (
            <div>
              <label className="label">Rent unit</label>
              <select className="input" value={form.rent_unit} onChange={update('rent_unit')}>
                <option value="hour">per hour</option>
                <option value="day">per day</option>
                <option value="week">per week</option>
                <option value="month">per month</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="label">City</label>
          <input className="input" required minLength={2} maxLength={80}
                 value={form.city} onChange={update('city')} placeholder="e.g. Bengaluru" />
        </div>

        <div>
          <label className="label">Photos (up to 5)</label>
          <input type="file" multiple accept="image/*" onChange={onPickFiles}
                 className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-white hover:file:bg-brand-700" />
          {previews.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mt-2">
              {previews.map((src, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-200">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            {create.isPending ? 'Posting…' : 'Post listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
