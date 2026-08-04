'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/features/tenant/api/tenantApi';
import { Truck, ArrowLeft, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function DeliverySettingsPage() {
  const router = useRouter();
  const { data: store } = useGetMyStoreQuery();
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const [steadfastApiKey, setSteadfastApiKey] = useState('');
  const [steadfastSecretKey, setSteadfastSecretKey] = useState('');
  const [pathaoClientId, setPathaoClientId] = useState('');
  const [pathaoClientSecret, setPathaoClientSecret] = useState('');

  useEffect(() => {
    if (store) {
      setSteadfastApiKey(store.steadfastApiKey || '');
      setSteadfastSecretKey(store.steadfastSecretKey || '');
      setPathaoClientId(store.pathaoClientId || '');
      setPathaoClientSecret(store.pathaoClientSecret || '');
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStore({
        steadfastApiKey: steadfastApiKey || undefined,
        steadfastSecretKey: steadfastSecretKey || undefined,
        pathaoClientId: pathaoClientId || undefined,
        pathaoClientSecret: pathaoClientSecret || undefined,
      } as any).unwrap();
      toast.success('Delivery API integrations saved successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save delivery settings.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <button
        type="button"
        onClick={() => router.push('/dashboard/settings')}
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all w-fit"
      >
        <ArrowLeft className="w-4 h-4 text-slate-600" />
        <span>Back to Manage Shop</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Delivery & Courier API Integration</h3>
            <p className="text-xs text-slate-400">Automate bookings with Steadfast and Pathao</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Steadfast Courier Integration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-800">Steadfast Courier</h4>
              <a
                href="https://steadfast.com.bd/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                Get API Keys <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Steadfast API Key
                </label>
                <input
                  type="text"
                  value={steadfastApiKey}
                  onChange={(e) => setSteadfastApiKey(e.target.value)}
                  placeholder="Paste API Key here..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Steadfast Secret Key
                </label>
                <input
                  type="password"
                  value={steadfastSecretKey}
                  onChange={(e) => setSteadfastSecretKey(e.target.value)}
                  placeholder="Paste Secret Key here..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          {/* Pathao Courier Integration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-800">Pathao Courier</h4>
              <a
                href="https://pathao.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                Get API Keys <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pathao Client ID
                </label>
                <input
                  type="text"
                  value={pathaoClientId}
                  onChange={(e) => setPathaoClientId(e.target.value)}
                  placeholder="Client ID..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pathao Client Secret
                </label>
                <input
                  type="password"
                  value={pathaoClientSecret}
                  onChange={(e) => setPathaoClientSecret(e.target.value)}
                  placeholder="Client Secret..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save Integrations'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
