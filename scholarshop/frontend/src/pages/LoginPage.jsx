import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiError } from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/');
    } catch (err) {
      const msg = apiError(err);
      setError(msg);
      if (err?.response?.data?.error?.code === 'EMAIL_NOT_VERIFIED') {
        const userId = err.response.data.error.details?.userId;
        navigate('/verify', { state: { userId, email: form.email } });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="text-slate-500 mt-1 text-sm">Login to your ScholarShop account.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label className="label" htmlFor="email">College email</label>
            <input id="email" type="email" required autoFocus className="input"
                   value={form.email} onChange={update('email')} placeholder="you@example.edu" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={8} className="input"
                   value={form.password} onChange={update('password')} placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-6 text-center">
          New to ScholarShop?{' '}
          <Link to="/register" className="text-brand-700 hover:underline font-medium">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
