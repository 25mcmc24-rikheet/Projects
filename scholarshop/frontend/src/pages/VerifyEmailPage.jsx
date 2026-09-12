import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiError } from '../api/client';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verify } = useAuth();
  const toast = useToast();

  const initialUserId = location.state?.userId || '';
  const initialEmail = location.state?.email || '';
  const initialOtp = location.state?.otp != null ? String(location.state.otp) : '';

  const [userId, setUserId] = useState(String(initialUserId));
  const [otp, setOtp] = useState(initialOtp);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      await verify({ userId: Number(userId), otp });
      toast.success('Email verified — welcome to ScholarShop!');
      navigate('/');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Verify your email</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {initialEmail
            ? <>We emailed a 6-digit code to <span className="font-medium text-slate-700">{initialEmail}</span>.</>
            : 'Enter the code we emailed to your college address.'}
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label className="label">User ID</label>
            <input className="input" required inputMode="numeric"
                   value={userId} onChange={(e) => setUserId(e.target.value.replace(/\D/g, ''))} />
          </div>
          <div>
            <label className="label">6-digit code</label>
            <input className="input tracking-[0.5em] text-center text-lg" required maxLength={6} pattern="[0-9]{6}"
                   value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Verifying…' : 'Verify email'}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-6 text-center">
          Didn't get the code?{' '}
          <Link to="/register" className="text-brand-700 hover:underline">Re-register</Link>
        </p>
      </div>
    </div>
  );
}
