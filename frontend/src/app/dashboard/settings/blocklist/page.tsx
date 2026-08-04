'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldBan, ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/features/tenant/api/tenantApi';

export default function BlocklistSettingsPage() {
  const router = useRouter();
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();

  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);
  const [newIp, setNewIp] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (store) {
      setBlockedIps(store.blockedIps || []);
      setBlockedEmails(store.blockedEmails || []);
    }
  }, [store]);

  const handleAddIp = () => {
    if (newIp && !blockedIps.includes(newIp)) {
      setBlockedIps([...blockedIps, newIp.trim()]);
      setNewIp('');
    }
  };

  const handleAddEmail = () => {
    if (newEmail && !blockedEmails.includes(newEmail)) {
      setBlockedEmails([...blockedEmails, newEmail.trim()]);
      setNewEmail('');
    }
  };

  const handleRemoveIp = (ipToRemove: string) => {
    setBlockedIps(blockedIps.filter(ip => ip !== ipToRemove));
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setBlockedEmails(blockedEmails.filter(email => email !== emailToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    try {
      await updateStore({
        blockedIps,
        blockedEmails,
      }).unwrap();
      toast.success('Blocklist updated successfully.');
    } catch (error) {
      toast.error('Failed to update blocklist.');
    }
  };

  if (isStoreLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

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

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
              <ShieldBan className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Blocklist Management</h2>
          </div>
          <p className="text-xs text-slate-500">
            Block abusive visitors, fake orders, and spammers by IP address or Email.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* IP Blocklist */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Blocked IP Addresses</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="e.g. 192.168.1.1"
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <button
                type="button"
                onClick={handleAddIp}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {blockedIps.length === 0 && <p className="text-xs text-slate-400 italic">No IPs blocked.</p>}
              {blockedIps.map(ip => (
                <div key={ip} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs font-mono text-slate-700">{ip}</span>
                  <button type="button" onClick={() => handleRemoveIp(ip)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Email Blocklist */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Blocked Email Addresses</h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. spammer@fake.com"
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {blockedEmails.length === 0 && <p className="text-xs text-slate-400 italic">No emails blocked.</p>}
              {blockedEmails.map(email => (
                <div key={email} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs font-medium text-slate-700">{email}</span>
                  <button type="button" onClick={() => handleRemoveEmail(email)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isUpdating ? 'Saving Blocklist...' : 'Save Blocklist'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
