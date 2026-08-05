'use client';

import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { Sparkles, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardRenderer } from '@/features/admin/components/core/DashboardRenderer';
import { MERCHANT_WIDGET_REGISTRY } from '@/features/dashboard/config/merchant.widgets';

export default function DashboardOverviewPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const {
    data: store,
    refetch: refetchStore,
  } = useGetMyStoreQuery();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const themePayment = params.get('theme_payment');
      if (themePayment === 'success') {
        if (store) {
          try {
            refetchStore();
          } catch (e) {}
        }
        toast.success(`🎉 Payment Successful via SSLCommerz! Premium Theme unlocked and activated.`);
        window.history.replaceState({}, document.title, window.location.pathname);
        router.push('/dashboard/themes');
      } else if (themePayment === 'failed' || themePayment === 'cancelled') {
        toast.error(`Payment ${themePayment}. Theme unlock was not completed.`);
        window.history.replaceState({}, document.title, window.location.pathname);
        router.push('/dashboard/themes');
      }
    }
  }, [store, router, refetchStore]);

  return (
    <div className="space-y-3">
      {/* Welcome Banner — Compact */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-5 border border-blue-500 shadow-sm">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-white/15 rounded-lg shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight truncate">
                {store?.name ? `${store.name} Control Center` : 'Merchant Control Center'}
              </h1>
              <p className="text-blue-200 text-xs mt-0.5 truncate">
                Welcome back, {user?.fullName || 'Store Owner'} · <span className="text-white/80 font-medium">{store?.slug ? `${store.slug}.easycommerce.app` : 'EasyCommerce'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard/products/create')}
            className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all active:scale-95 shrink-0 border border-white/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Dynamic Widget Grid via Registry */}
      <DashboardRenderer 
        registry={MERCHANT_WIDGET_REGISTRY} 
        layoutId="merchant-dashboard-default"
        flattenLayout={true}
      />
    </div>
  );
}

