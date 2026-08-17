'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/features/tenant/api/tenantApi';
import { Link2, ArrowLeft, Save, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function DomainSettingsPage() {
  const router = useRouter();
  const { data: store } = useGetMyStoreQuery();
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const [domain, setDomain] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (store) {
      setDomain(store.domain || '');
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStore({ domain: domain || undefined } as any).unwrap();
      toast.success('Domain settings saved successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save domain settings.');
    }
  };

  const cnameRecord = 'cname.bitcommerce.com';

  const copyCname = () => {
    navigator.clipboard.writeText(cnameRecord);
    setCopied(true);
    toast.success('CNAME record copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
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
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Shop Domain & Routing</h3>
              <p className="text-xs text-slate-400">Subdomain address & CNAME record setup</p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Subdomain Active</span>
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Current Subdomain
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500">
                <span className="text-slate-900 font-bold">{store?.slug}</span>
                <span>.bitcommerce.com</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-normal">
                Your default free subdomain provided by BitCommerce.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Custom Domain (e.g. yourbrand.com)
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="www.yourbrand.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1 font-normal">
                Leave blank to use default subdomain. Requires DNS setup below.
              </p>
            </div>

            <div className="sm:col-span-2 mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
              <h4 className="font-bold text-sm text-blue-900 mb-2">DNS Configuration Setup</h4>
              <p className="text-xs text-blue-700 font-normal mb-3">
                To connect your custom domain, log in to your domain provider (e.g., Namecheap, GoDaddy) and add a CNAME record pointing to our servers.
              </p>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs font-mono text-blue-800">
                  {cnameRecord}
                </div>
                <button
                  type="button"
                  onClick={copyCname}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save Domain Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
