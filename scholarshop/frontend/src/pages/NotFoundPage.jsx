import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md text-center py-20 px-4">
      <h1 className="text-5xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-slate-500">We couldn't find that page.</p>
      <Link to="/" className="btn-primary inline-block mt-6">Back home</Link>
    </div>
  );
}
