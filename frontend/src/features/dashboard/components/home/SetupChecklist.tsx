'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { useGetProductsQuery } from '@/features/catalog/api/catalogApi';
import { Skeleton } from '@/components/ui/Skeleton';

export function SetupChecklist() {
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: products = [], isLoading: isProductsLoading } = useGetProductsQuery(undefined, { skip: !store });

  const isLoading = isStoreLoading || isProductsLoading;

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tasks = [
    {
      id: 'profile',
      label: 'Store profile created',
      completed: Boolean(store),
      link: '/dashboard/settings',
    },
    {
      id: 'domain',
      label: 'Store URL configured',
      completed: Boolean(store?.slug || store?.domain),
      link: '/dashboard/settings',
    },
    {
      id: 'products',
      label: 'Add your first product',
      completed: products.length > 0,
      link: '/dashboard/products/create',
    },
    {
      id: 'payment',
      label: 'Connect payment gateway',
      completed: Boolean((store as any)?.sslCommerzStoreId),
      link: '/dashboard/settings', // Adjust if you have a specific payment settings page
    },
    {
      id: 'courier',
      label: 'Connect courier service',
      completed: Boolean((store as any)?.steadfastApiKey || (store as any)?.pathaoClientId),
      link: '/dashboard/settings',
    },
  ];

  const completedCount = tasks.filter((t) => t.completed).length;
  const isAllCompleted = completedCount === tasks.length;

  if (isAllCompleted) {
    return null; // Don't show if everything is done
  }

  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1 max-w-xl">
          <h2 className="text-[17px] font-bold text-slate-900">Get your store ready</h2>
          <p className="text-[13px] text-slate-500 mt-1 mb-6">
            Your store is almost ready. Complete these steps to start accepting orders on your storefront.
          </p>

          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 group">
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                )}
                <Link
                  href={task.link}
                  className={`text-[14px] font-medium transition-colors ${
                    task.completed
                      ? 'text-slate-400 line-through'
                      : 'text-slate-700 hover:text-blue-600'
                  }`}
                >
                  {task.label}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="md:w-64 shrink-0 bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col justify-center">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Setup Progress
          </p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-black text-slate-900 leading-none">
              {completedCount}
            </span>
            <span className="text-[13px] font-medium text-slate-500 pb-0.5">
              of {tasks.length} completed
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-5">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <Link
            href={tasks.find((t) => !t.completed)?.link || '/dashboard'}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold rounded-lg shadow-sm transition-colors"
          >
            Continue setup
          </Link>
        </div>
      </div>
    </div>
  );
}
