'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetStoreBySlugQuery } from '@/features/tenant/api/tenantApi';
import { useLazyTrackPublicOrderQuery } from '@/features/order/api/orderApi';
import { ShopEaseNavbar } from '@/features/storefront/components/ShopEaseNavbar';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import {
  Search,
  Truck,
  CheckCircle2,
  Package,
  ArrowRight,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  { key: 'PENDING', label: 'Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export default function StoreOrderTrackingPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { data: store } = useGetStoreBySlugQuery(slug, {
    skip: !slug,
  });
  const primaryColor = store?.primaryColor || '#2563eb';

  const [query, setQuery] = useState('');
  const [triggerTrack, { data: trackingResults = [], isLoading, isError, error }] = useLazyTrackPublicOrderQuery();
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !slug) return;
    setHasSearched(true);
    triggerTrack({ query: query.trim(), storeSlug: slug });
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'CONFIRMED':
        return 2;
      case 'PROCESSING':
        return 3;
      case 'SHIPPED':
        return 4;
      case 'DELIVERED':
        return 5;
      case 'CANCELLED':
        return 0;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <CartDrawer primaryColor={primaryColor} />
      <ShopEaseNavbar
        storeName={store?.name || 'Storefront'}
        slug={slug}
        category={store?.category}
        primaryColor={primaryColor}
        logo={store?.logo}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <Link
          href={`/store/${slug}`}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
        >
          <span>← Back to {store?.name || 'Store'}</span>
        </Link>

        {/* Search Hero */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-8 sm:p-10 text-center">
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg"
            style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -6px ${primaryColor}66` }}
          >
            <Truck className="w-6 h-6 text-white" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Track your order
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-sm mx-auto">
            Enter your order number or phone number to see the latest status from {store?.name || 'the store'}.
          </p>

          <form onSubmit={handleSearch} className="pt-6 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ORD-1001 or 01700000000"
                className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-transparent rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 px-6 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shrink-0 disabled:opacity-60"
              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 24px -8px ${primaryColor}80` }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Track</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {isError && hasSearched && (
          <div className="bg-white rounded-3xl border border-red-100 p-8 shadow-sm text-center space-y-3">
            <div className="w-11 h-11 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">No orders found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {(error as any)?.data?.message || `We couldn't find anything matching "${query}". Double-check your order number or phone number.`}
            </p>
          </div>
        )}

        {trackingResults.length > 0 && (
          <div className="space-y-5">
            {trackingResults.map((order) => {
              const activeStep = getStepIndex(order.orderStatus);

              return (
                <div key={order.id} className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8 space-y-7">
                  {/* Order header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-extrabold text-base text-slate-900">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 font-bold text-[10px] rounded-full ${
                            order.orderStatus === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : order.orderStatus === 'CANCELLED'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        Placed {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Total
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">
                        ৳{order.grandTotal.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium ml-1">{order.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Stepper */}
                  {order.orderStatus !== 'CANCELLED' ? (
                    <div className="flex items-center">
                      {STEPS.map((step, idx) => {
                        const stepNum = idx + 1;
                        const isDone = activeStep >= stepNum;
                        const isLast = idx === STEPS.length - 1;
                        return (
                          <React.Fragment key={step.key}>
                            <div className="flex flex-col items-center gap-2 shrink-0">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  isDone
                                    ? stepNum === 5
                                      ? 'bg-emerald-500 text-white'
                                      : 'text-white'
                                    : 'bg-slate-100 text-slate-300'
                                }`}
                                style={isDone && stepNum !== 5 ? { backgroundColor: primaryColor } : undefined}
                              >
                                {isDone ? <Check className="w-3.5 h-3.5" /> : <span className="text-[11px] font-bold">{stepNum}</span>}
                              </div>
                              <span className={`text-[10px] font-bold text-center whitespace-nowrap ${isDone ? 'text-slate-900' : 'text-slate-300'}`}>
                                {step.label}
                              </span>
                            </div>
                            {!isLast && (
                              <div
                                className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all ${activeStep > stepNum ? '' : 'bg-slate-100'}`}
                                style={activeStep > stepNum ? { backgroundColor: primaryColor } : undefined}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>This order was cancelled.</span>
                    </div>
                  )}

                  {/* Courier tracking */}
                  {order.consignment && (
                    <div className="p-5 bg-slate-50 rounded-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 text-white rounded-xl shrink-0" style={{ backgroundColor: primaryColor }}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">
                              {order.consignment.courierProvider}
                            </span>
                            <span className="text-[10px] text-slate-500">Tracking number</span>
                          </div>
                        </div>

                        <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-900 font-mono font-bold text-xs rounded-xl self-start sm:self-auto">
                          {order.consignment.trackingCode}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>Status: <span className="text-slate-900">{order.consignment.status.replace(/_/g, ' ')}</span></span>
                        {order.consignment.codAmount > 0 && (
                          <span>COD: ৳{order.consignment.codAmount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">
                      Items
                    </h4>

                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{item.productTitle}</span>
                            <span className="text-[10px] text-slate-400">
                              {item.quantity} × ৳{item.price.toLocaleString()}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900">
                            ৳{item.totalPrice.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
