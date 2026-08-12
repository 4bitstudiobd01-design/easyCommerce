'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DashboardHeaderTitle() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  
  const firstName = user?.fullName?.split(' ')[0] || 'Merchant';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Good morning, {firstName} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's what's happening with your store today.
        </p>
      </div>

      <button
        onClick={() => router.push('/dashboard/products/create')}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors w-full sm:w-auto"
      >
        <Plus className="w-4 h-4" />
        <span>Add Product</span>
      </button>
    </div>
  );
}
