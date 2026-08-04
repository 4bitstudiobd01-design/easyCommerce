'use client';

import { ReviewManagementTable } from '@/features/catalog/components/ReviewManagementTable';

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Reviews</h1>
        <p className="text-xs text-slate-500 mt-1">Moderate, approve, and manage product reviews from your customers.</p>
      </div>
      <ReviewManagementTable />
    </div>
  );
}
