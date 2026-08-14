'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, CreditCard, Truck, Landmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PaymentMethodType, PaymentTopMethod } from '../api/paymentApi';
import { formatCurrency, getBrandStyle } from '../utils/paymentFormatters';

interface TopPaymentMethodsCardProps {
  methods?: PaymentTopMethod[];
  currency: string;
  isLoading: boolean;
}

const METHOD_ICONS: Record<PaymentMethodType, React.ElementType> = {
  BKASH: Smartphone,
  NAGAD: Smartphone,
  ROCKET: Smartphone,
  UPAY: Smartphone,
  CARD: CreditCard,
  BANK_TRANSFER: Landmark,
  COD: Truck,
};

export const TopPaymentMethodsCard = ({
  methods,
  currency,
  isLoading,
}: TopPaymentMethodsCardProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">Top Payment Methods</h3>
        <Link
          href="/dashboard/payments?tab=methods"
          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          View All
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-2.5 w-16 rounded" />
              </div>
              <Skeleton className="h-3 w-10 rounded" />
            </div>
          ))}
        </div>
      ) : !methods || methods.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center font-medium">
          No payment activity in this period.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {methods.map((method) => {
            const Icon = METHOD_ICONS[method.method] ?? CreditCard;
            return (
              <li key={method.method} className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getBrandStyle(
                    method.method,
                  )}`}
                  aria-hidden="true"
                >
                  <Icon className="w-4 h-4" strokeWidth={2.25} />
                </span>

                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {method.label}
                  </span>
                  <span className="block text-[11px] font-medium text-slate-400">
                    {formatCurrency(method.amount, currency)}
                  </span>
                </span>

                <span className="flex flex-col items-end shrink-0">
                  <span className="text-[11px] font-medium text-slate-500 leading-tight">
                    {method.count.toLocaleString('en-US')} txns
                  </span>
                  <span className="text-xs font-bold text-slate-900 leading-tight mt-0.5">
                    {method.percentage}%
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
