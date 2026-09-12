import React, { useState } from 'react';
import StarRating from './StarRating.jsx';
import { reviewsApi } from '../../api/reviews';
import { useToast } from '../../context/ToastContext.jsx';
import { apiError } from '../../api/client';

export default function ReviewForm({ orderId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewsApi.create({ orderId, rating, comment });
      toast.success('Thanks for the review!');
      setComment('');
      onSubmitted?.();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3">
      <p className="label">Your rating</p>
      <StarRating value={rating} onChange={setRating} size="lg" />
      <textarea
        className="input min-h-[80px]"
        placeholder="Share your experience (optional)"
        maxLength={1000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
