'use client';

import React, { useState } from 'react';
import {
  useGetApprovedReviewsQuery,
  useCreateReviewMutation,
} from '@/features/catalog/api/catalogApi';
import {
  Star,
  CheckCircle2,
  Plus,
  MessageSquare,
  Sparkles,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductReviewsSectionProps {
  productId: string;
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const { data, isLoading, refetch } = useGetApprovedReviewsQuery(productId);
  const [createReview, { isLoading: isSubmitting }] = useCreateReviewMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [comment, setComment] = useState('');

  const { reviews = [], avgRating = 5.0, totalCount = 0 } = data || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewerName.trim() || !comment.trim()) {
      toast.error('Please fill in your name and review comment.');
      return;
    }

    try {
      await createReview({
        productId,
        rating,
        reviewerName,
        reviewerEmail: reviewerEmail || undefined,
        comment,
      }).unwrap();

      toast.success('Thank you! Your review has been submitted for approval.');
      setIsModalOpen(false);
      setReviewerName('');
      setReviewerEmail('');
      setComment('');
      setRating(5);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit review.');
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t border-slate-100">
      {/* HEADER & STAR RATING SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-black text-slate-900 tracking-tight">{avgRating}</div>
          <div>
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500 font-medium">Based on {totalCount} reviews</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* REVIEWS LIST */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-16 bg-slate-100 animate-pulse rounded-2xl" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
          <MessageSquare className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No reviews yet for this product</p>
          <p className="text-[11px] text-slate-400">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev: any) => (
            <div key={rev.id} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                    {rev.reviewerName[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{rev.reviewerName}</span>
                  {rev.isVerifiedBuyer && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Buyer
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-700 font-normal leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* WRITE A REVIEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">Write a Review</h3>
                <p className="text-xs text-slate-400">Share your rating and feedback with buyers</p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Your Overall Rating</label>
                <div className="flex items-center gap-1.5 text-amber-400 cursor-pointer">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starNum = i + 1;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(starNum)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            starNum <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-slate-900 font-bold text-xs ml-2">{rating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Tanvir Hossain"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                  placeholder="e.g. tanvir@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Your Review Feedback</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked about this product..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-700/20 transition-all active:scale-95"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
