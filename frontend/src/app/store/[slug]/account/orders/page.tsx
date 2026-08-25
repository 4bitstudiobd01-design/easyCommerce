'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/store';
import { useGetStoreBySlugQuery } from '@/features/tenant/api/tenantApi';
import { useGetMyOrdersQuery } from '@/features/storefront/api/customerAccountApi';
import { ShopEaseNavbar } from '@/features/storefront/components/ShopEaseNavbar';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import { Package, Truck, Loader2, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

export default function MyOrdersPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const { data: store } = useGetStoreBySlugQuery(slug, { skip: !slug });
  const primaryColor = store?.primaryColor || '#2563eb';

  const isAuthenticated = useSelector((s: RootState) => s.customerAuth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/store/${slug}`);
    }
  }, [isAuthenticated, slug, router]);

  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetMyOrdersQuery(
    { storeSlug: slug, page, limit: 10 },
    { skip: !slug || !isAuthenticated }
  );

  if (!isAuthenticated) return null;

  const orders = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <CartDrawer />
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

        <div className="flex items-center gap-2">
          <Link
            href={`/store/${slug}/account`}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
          >
            Profile
          </Link>
          <Link
            href={`/store/${slug}/account/orders`}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200/80 shadow-sm"
            style={{ color: primaryColor }}
          >
            My Orders
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-16 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-10 text-center space-y-3">
            <div className="w-11 h-11 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">No orders yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Orders you place with {store?.name || 'this store'} will show up here.
            </p>
            <Link
              href={`/store/${slug}/shop`}
              className="inline-flex items-center gap-2 mt-2 h-10 px-5 text-white text-xs font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98]"
              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 24px -8px ${primaryColor}80` }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
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
                      Placed {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {order.itemsCount} item{order.itemsCount === 1 ? '' : 's'}
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

                {order.courierProvider && (
                  <div className="p-5 bg-slate-50 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 text-white rounded-xl shrink-0" style={{ backgroundColor: primaryColor }}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">{order.courierProvider}</span>
                          <span className="text-[10px] text-slate-500">Tracking number</span>
                        </div>
                      </div>
                      {order.trackingCode && (
                        <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-900 font-mono font-bold text-xs rounded-xl self-start sm:self-auto">
                          {order.trackingCode}
                        </span>
                      )}
                    </div>
                    {order.consignmentStatus && (
                      <div className="pt-3 border-t border-slate-200/80 text-[11px] font-bold text-slate-600">
                        Status: <span className="text-slate-900">{order.consignmentStatus.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  className="h-10 px-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-xs font-bold text-slate-700 flex items-center gap-1.5 disabled:opacity-40 cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="text-xs font-bold text-slate-400">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages || isFetching}
                  className="h-10 px-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-xs font-bold text-slate-700 flex items-center gap-1.5 disabled:opacity-40 cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
