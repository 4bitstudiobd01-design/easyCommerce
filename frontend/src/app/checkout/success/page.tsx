'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Store as StoreIcon, CreditCard } from 'lucide-react';
import { useGetPublicStoreProductsQuery } from '@/features/storefront/api/storefrontApi';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || '';
  const storeSlug = searchParams.get('storeSlug') || '';

  const { data: storeData } = useGetPublicStoreProductsQuery({ slug: storeSlug }, { skip: !storeSlug });
  const store = storeData?.store;
  const primaryColor = (store as any)?.primaryColor || '#2563eb';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden p-8 text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-lg shadow-emerald-600/10">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Payment Verified via SSLCommerz</span>
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
          Payment Successful!
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Your transaction has been verified{store?.name ? ` for ${store.name}` : ''}.{' '}
          {orderNumber ? (
            <>Order <span className="font-bold text-slate-900">#{orderNumber}</span> status is updated to </>
          ) : (
            'Your order status is updated to '
          )}
          <span className="font-bold text-emerald-600">PAID & CONFIRMED</span>.
        </p>
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
        <div className="flex justify-between text-slate-600">
          <span>Order Invoice:</span>
          <span className="font-bold text-slate-900">{orderNumber ? `#${orderNumber}` : '—'}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Payment Status:</span>
          <span className="font-bold text-emerald-600">PAID (COMPLETED)</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Payment Provider:</span>
          <span className="font-bold flex items-center gap-1" style={{ color: primaryColor }}>
            <CreditCard className="w-3.5 h-3.5" />
            <span>SSLCommerz Secured Gateway</span>
          </span>
        </div>
      </div>

      <Link
        href={storeSlug ? `/store/${storeSlug}` : '/'}
        className="w-full py-3.5 px-4 hover:brightness-110 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-lg"
        style={{ backgroundColor: primaryColor }}
      >
        <StoreIcon className="w-4 h-4" />
        <span>Return to Digital Storefront</span>
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <Suspense fallback={<div className="text-xs font-bold text-slate-600">Loading invoice...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
