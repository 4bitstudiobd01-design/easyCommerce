'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Smartphone, CreditCard, Landmark, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PaymentGatewayCode, PaymentGatewaySummary } from '../api/paymentApi';
import { getBrandStyle } from '../utils/paymentFormatters';

interface PaymentGatewaysCardProps {
  gateways?: PaymentGatewaySummary[];
  isLoading: boolean;
}

const GATEWAY_ICONS: Record<PaymentGatewayCode, React.ElementType> = {
  BKASH: Smartphone,
  NAGAD: Smartphone,
  SSLCOMMERZ: Landmark,
  STRIPE: CreditCard,
  PAYPAL: CreditCard,
  COD: Truck,
  MANUAL: Landmark,
};

const STATUS_STYLES: Record<PaymentGatewaySummary['status'], string> = {
  CONNECTED: 'text-emerald-600',
  DISCONNECTED: 'text-slate-400',
  DISABLED: 'text-red-500',
};

const STATUS_LABELS: Record<PaymentGatewaySummary['status'], string> = {
  CONNECTED: 'Connected',
  DISCONNECTED: 'Not connected',
  DISABLED: 'Disabled',
};

export const PaymentGatewaysCard = ({ gateways, isLoading }: PaymentGatewaysCardProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">Payment Gateways</h3>
        <Link
          href="/dashboard/payments?tab=gateways"
          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          Manage All
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-2.5 w-24 rounded" />
              </div>
              <Skeleton className="h-3 w-14 rounded" />
            </div>
          ))}
        </div>
      ) : !gateways || gateways.length === 0 ? (
        <p className="text-xs text-slate-400 py-6 text-center font-medium">
          No payment gateways connected yet.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {gateways.map((gateway) => {
            const Icon = GATEWAY_ICONS[gateway.code] ?? CreditCard;
            return (
              <li key={gateway.id} className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getBrandStyle(
                    gateway.code,
                  )}`}
                  aria-hidden="true"
                >
                  <Icon className="w-4 h-4" strokeWidth={2.25} />
                </span>

                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {gateway.name}
                  </span>
                  <span className="block text-[11px] font-medium text-slate-400 truncate">
                    {gateway.kind}
                  </span>
                </span>

                <span
                  className={`text-[11px] font-bold shrink-0 ${STATUS_STYLES[gateway.status]}`}
                >
                  {STATUS_LABELS[gateway.status]}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/dashboard/settings/payment"
        className="mt-5 w-full py-2.5 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        Connect New Gateway
      </Link>
    </div>
  );
};
