'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/features/tenant/api/tenantApi';
import { MessageSquare, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SmsSettingsPage() {
  const router = useRouter();
  const { data: store } = useGetMyStoreQuery();
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const [smsDriver, setSmsDriver] = useState<'BULKSMSBD' | 'GREENWEB' | 'TWILIO' | 'DISABLED'>('BULKSMSBD');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsSenderId, setSmsSenderId] = useState('');

  useEffect(() => {
    if (store) {
      setSmsDriver((store as any).smsDriver || 'BULKSMSBD');
      setSmsApiKey((store as any).smsApiKey || '');
      setSmsSenderId((store as any).smsSenderId || '');
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStore({
        smsDriver,
        smsApiKey: smsApiKey || undefined,
        smsSenderId: smsSenderId || undefined,
      } as any).unwrap();
      toast.success('SMS Support settings saved successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save SMS settings.');
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
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">SMS Notification Gateway</h3>
            <p className="text-xs text-slate-400">Send order updates and OTPs via SMS</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Active SMS Provider
              </label>
              <select
                value={smsDriver}
                onChange={(e) => setSmsDriver(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="DISABLED">Disable SMS Notifications</option>
                <option value="BULKSMSBD">BulkSMS BD</option>
                <option value="GREENWEB">Greenweb SMS</option>
                <option value="TWILIO">Twilio</option>
              </select>
            </div>

            {smsDriver !== 'DISABLED' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    API Key / Auth Token
                  </label>
                  <input
                    type="password"
                    value={smsApiKey}
                    onChange={(e) => setSmsApiKey(e.target.value)}
                    placeholder="API Key..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Sender ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={smsSenderId}
                    onChange={(e) => setSmsSenderId(e.target.value)}
                    placeholder="e.g. 880961234567"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save SMS Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
