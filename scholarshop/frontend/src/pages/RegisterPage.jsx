import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiError } from '../api/client';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', email: '', college: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const res = await register(form);
      toast.success('Verification code sent to your college email.');
      navigate('/verify', {
        state: {
          userId: res.userId,
          email: form.email,
          ...(res.otp != null && { otp: res.otp }),
        },
      });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
        <p className="text-slate-500 mt-1 text-sm">Use your college email to get verified.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label className="label">Full name</label>
            <input className="input" required minLength={2} maxLength={100}
                   value={form.name} onChange={update('name')} />
          </div>
          <div>
            <label className="label">College email</label>
            <input type="email" className="input" required
                   value={form.email} onChange={update('email')} placeholder="you@example.edu" />
            <p className="text-xs text-slate-500 mt-1">Only allowed college email domains can register.</p>
          </div>
          <div>
            <label className="label">College / University</label>
            <input className="input" required minLength={2} maxLength={150}
                   value={form.college} onChange={update('college')} placeholder="Example University" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" required minLength={8}
                   value={form.password} onChange={update('password')} placeholder="At least 8 characters" />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-700 hover:underline font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}
