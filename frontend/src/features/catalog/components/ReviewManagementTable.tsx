'use client';

import React, { useState } from 'react';
import {
  useGetMerchantReviewsQuery,
  useToggleReviewApprovalMutation,
  useDeleteReviewMutation,
  Review,
} from '../api/catalogApi';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  MessageSquare,
  Search,
  UserCheck,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

export function ReviewManagementTable() {
  const { data: reviews = [], isLoading } = useGetMerchantReviewsQuery();
  const [toggleReviewApproval, { isLoading: isToggling }] = useToggleReviewApprovalMutation();
  const [deleteReview] = useDeleteReviewMutation();

  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggle = async (review: Review) => {
    try {
      await toggleReviewApproval({
        id: review.id,
        isApproved: !review.isApproved,
      }).unwrap();

      toast.success(
        !review.isApproved
          ? `Review by "${review.reviewerName}" approved!`
          : `Review by "${review.reviewerName}" set to pending.`
      );
    } catch (err: any) {
      toast.error('Failed to update review status.');
    }
  };

  const handleDelete = async (review: Review) => {
    if (confirm(`Delete review by "${review.reviewerName}"?`)) {
      try {
        await deleteReview(review.id).unwrap();
        toast.success('Review deleted successfully.');
      } catch (err: any) {
        toast.error('Failed to delete review.');
      }
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'APPROVED' && r.isApproved) ||
      (filter === 'PENDING' && !r.isApproved);

    const matchesSearch =
      r.reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.product?.title || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. TOP HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customer Reviews & Ratings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Moderate, approve, or reject customer feedback for storefront display.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-extrabold text-xs text-amber-900">
              {reviews.length > 0
                ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
                : '5.0'}{' '}
              / 5.0 Avg Rating
            </span>
          </div>

          {pendingCount > 0 && (
            <span className="px-3 py-1.5 bg-purple-100 text-purple-800 font-extrabold text-xs rounded-xl border border-purple-200">
              {pendingCount} Pending Approval
            </span>
          )}
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'PENDING', 'APPROVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all ${
                filter === tab
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Reviews' : tab === 'PENDING' ? 'Pending Approval' : 'Approved'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviewer or product..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
          />
        </div>
      </div>

      {/* 3. REVIEWS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-bold">
              <tr>
                <th className="px-6 py-4">Reviewer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-center">Rating</th>
                <th className="px-6 py-4">Comment</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    No customer reviews found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{review.reviewerName}</span>
                          {review.isVerifiedBuyer && (
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-md border border-emerald-200">
                              Verified
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block">{review.reviewerEmail || 'No email provided'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900">
                      {review.product?.title || 'Catalog Product'}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-slate-800 text-xs font-normal line-clamp-2">{review.comment}</p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {review.isApproved ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] rounded-full border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-extrabold text-[10px] rounded-full border border-amber-200 inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(review)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                            review.isApproved
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {review.isApproved ? 'Unapprove' : 'Approve'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(review)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
