'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  ArrowLeft,
  ExternalLink,
  Plug,
  CheckCircle2,
  AlertCircle,
  Settings,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  useGetCouriersDashboardQuery,
  useToggleCourierIntegrationMutation,
  useSetDefaultCourierMutation,
  type CourierDashboardItem,
} from '@/features/logistics/api/logisticsApi';
import { CourierConnectModal } from '@/features/logistics/components/CourierConnectModal';
import { CourierDetailsDrawer } from '@/features/logistics/components/CourierDetailsDrawer';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

export default function DeliverySettingsPage() {
  const router = useRouter();
  const { data, isLoading, refetch } = useGetCouriersDashboardQuery();
  const [toggleIntegration] = useToggleCourierIntegrationMutation();
  const [setDefaultCourier] = useSetDefaultCourierMutation();

  const [connectingCourier, setConnectingCourier] = useState<CourierDashboardItem | null>(null);
  const [selectedDrawerProvider, setSelectedDrawerProvider] = useState<string | null>(null);

  const couriers = data?.couriers ?? [];

  const handleToggle = async (courier: CourierDashboardItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!courier.hasCredentials) {
      setConnectingCourier(courier);
      return;
    }
    try {
      await toggleIntegration({
        provider: courier.code,
        isEnabled: !courier.isEnabled,
      }).unwrap();
      toast.success(
        `${courier.name} ${!courier.isEnabled ? 'activated' : 'disabled'} successfully.`,
      );
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to toggle courier state.');
    }
  };

  const handleSetDefault = async (courier: CourierDashboardItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!courier.isEnabled) {
      toast.error(`Please activate ${courier.name} first before setting it as default.`);
      return;
    }
    try {
      await setDefaultCourier(courier.code).unwrap();
      toast.success(`${courier.name} set as primary default courier.`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to set default courier.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Top Breadcrumb & Logistics Hub Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/settings')}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Back to Manage Shop</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/dashboard/logistics?tab=couriers')}
          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200/80 flex items-center gap-2 transition-all w-fit cursor-pointer"
        >
          <span>Open Full Logistics Hub</span>
          <ArrowRight className="w-4 h-4 text-blue-600" />
        </button>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-2xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg text-slate-900">Delivery & Courier API Integrations</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect and automate order fulfillment across Bangladesh’s top 6 courier services.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <span className="flex items-center gap-1.5 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> AES-256 Encrypted Credentials
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <Zap className="w-4 h-4 text-amber-500" /> One-Click Order Booking & Label Printing
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-blue-600" /> Live Waybill & Tracking Webhooks
          </span>
        </div>
      </div>

      {/* Couriers Grid (All 6 Couriers) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm text-slate-900">Supported Courier Partners (6)</h2>
          <span className="text-xs text-slate-500">
            {couriers.filter((c) => c.isEnabled).length} of {couriers.length || 6} Connected
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-32 rounded-lg" />
                <Skeleton className="h-4 w-48 rounded-md" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {couriers.map((courier) => {
              const isConnected = courier.isEnabled;
              const hasCreds = courier.hasCredentials;

              return (
                <div
                  key={courier.code}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Top Bar */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-center font-black text-blue-700 text-lg shadow-2xs">
                          {courier.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-sm text-slate-900">{courier.name}</h3>
                            {courier.isDefault && (
                              <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {courier.type || 'Courier Service'}
                          </span>
                        </div>
                      </div>

                      {/* Status Dot */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isConnected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isConnected ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {isConnected ? 'Active' : 'Not Connected'}
                      </span>
                    </div>

                    {/* Coverage & COD Specs */}
                    <div className="flex items-center justify-between text-[11px] font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                      <span>COD Support: <strong className="text-slate-900">{courier.codSupport ? 'Yes' : 'No'}</strong></span>
                      <span>Coverage: <strong className="text-slate-900">{courier.coverage || 'All BD'}</strong></span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConnectingCourier(courier)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          hasCreds
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20'
                        }`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>{hasCreds ? 'Configure API' : 'Connect Courier'}</span>
                      </button>

                      {hasCreds && (
                        <button
                          type="button"
                          onClick={(e) => handleToggle(courier, e)}
                          title={isConnected ? 'Disable Courier' : 'Enable Courier'}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isConnected
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <Plug className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {hasCreds && isConnected && !courier.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => handleSetDefault(courier, e)}
                        className="w-full py-1 text-center text-[11px] font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        Set as primary default
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Courier Credential Modal */}
      {connectingCourier && (
        <CourierConnectModal
          courier={connectingCourier}
          isOpen={Boolean(connectingCourier)}
          onClose={() => {
            setConnectingCourier(null);
            refetch();
          }}
        />
      )}

      {/* Courier Full Details Drawer */}
      {selectedDrawerProvider && (
        <CourierDetailsDrawer
          provider={selectedDrawerProvider}
          isOpen={Boolean(selectedDrawerProvider)}
          onClose={() => {
            setSelectedDrawerProvider(null);
            refetch();
          }}
          onEditCredentials={(c) => {
            setSelectedDrawerProvider(null);
            setConnectingCourier(c);
          }}
        />
      )}
    </div>
  );
}
