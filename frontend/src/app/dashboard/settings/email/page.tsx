'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/features/tenant/api/tenantApi';
import { Mail, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailSettingsPage() {
  const router = useRouter();
  const { data: store } = useGetMyStoreQuery();
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const [emailDriver, setEmailDriver] = useState<'SMTP' | 'SENDGRID' | 'DISABLED'>('SMTP');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [fromEmail, setFromEmail] = useState('');

  useEffect(() => {
    if (store) {
      setEmailDriver((store as any).emailDriver || 'SMTP');
      setSmtpHost((store as any).smtpHost || '');
      setSmtpPort((store as any).smtpPort || 587);
      setSmtpUser((store as any).smtpUser || '');
      setSmtpPass((store as any).smtpPass || '');
      setFromEmail((store as any).fromEmail || '');
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStore({
        emailDriver,
        smtpHost: smtpHost || undefined,
        smtpPort: Number(smtpPort) || 587,
        smtpUser: smtpUser || undefined,
        smtpPass: smtpPass || undefined,
        fromEmail: fromEmail || undefined,
      } as any).unwrap();
      toast.success('Email Gateway settings saved successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save email settings.');
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
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Email Gateway</h3>
            <p className="text-xs text-slate-400">Configure SMTP for transactional emails</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Active Email Provider
              </label>
              <select
                value={emailDriver}
                onChange={(e) => setEmailDriver(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="DISABLED">Disable Emails</option>
                <option value="SMTP">SMTP (Recommended)</option>
                <option value="SENDGRID">SendGrid API</option>
              </select>
            </div>

            {emailDriver === 'SMTP' && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Sender From Address
                  </label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="noreply@yourdomain.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.mailgun.org"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="Username..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    SMTP Password
                  </label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="Password..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </>
            )}

            {emailDriver === 'SENDGRID' && (
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  SendGrid API Key
                </label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="SG.xxxxx..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save Email Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
