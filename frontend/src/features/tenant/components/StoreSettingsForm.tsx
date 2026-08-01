'use client';

import React, { useState, useEffect } from 'react';
import { Store, useUpdateStoreMutation } from '../api/tenantApi';
import { Settings, Truck, Key, CheckCircle2, Save, Store as StoreIcon, ShieldCheck } from 'lucide-react';

interface StoreSettingsFormProps {
  store: Store | null;
}

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [steadfastApiKey, setSteadfastApiKey] = useState('');
  const [steadfastSecretKey, setSteadfastSecretKey] = useState('');
  const [pathaoClientId, setPathaoClientId] = useState('');
  const [pathaoClientSecret, setPathaoClientSecret] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setPhone(store.phone || '');
      setAddress(store.address || '');
      setSteadfastApiKey(store.steadfastApiKey || '');
      setSteadfastSecretKey(store.steadfastSecretKey || '');
      setPathaoClientId(store.pathaoClientId || '');
      setPathaoClientSecret(store.pathaoClientSecret || '');
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateStore({
        name,
        phone,
        address,
        steadfastApiKey: steadfastApiKey || undefined,
        steadfastSecretKey: steadfastSecretKey || undefined,
        pathaoClientId: pathaoClientId || undefined,
        pathaoClientSecret: pathaoClientSecret || undefined,
      }).unwrap();

      setSuccessMsg('Store settings and Courier API Keys updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to update store settings.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 font-bold text-xs rounded-2xl">
          {errorMsg}
        </div>
      )}

      {/* 1. General Store Settings */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">General Store Configuration</h3>
            <p className="text-xs text-slate-400">Basic merchant information & store identity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Store Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Store Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01700000000"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Warehouse Pickup Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House #10, Road #5, Dhanmondi, Dhaka"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Store Subdomain Slug
            </label>
            <p className="font-mono text-sm font-bold text-blue-600 p-3 bg-slate-100 rounded-xl border border-slate-200">
              {store?.slug}.easycommerce.app
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Tenant ID
            </label>
            <p className="font-mono text-xs text-slate-500 p-3 bg-slate-100 rounded-xl border border-slate-200 truncate">
              {store?.tenantId}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Courier API Credentials Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Courier Partner API Keys</h3>
              <p className="text-xs text-slate-400">Configure your Steadfast & Pathao merchant credentials</p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Keys</span>
          </span>
        </div>

        {/* Steadfast Courier Credentials Card */}
        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-blue-900">Steadfast Courier Credentials</span>
            <span className="px-2 py-0.5 bg-blue-600 text-white font-bold text-[9px] rounded-full">Primary</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Steadfast Api-Key</label>
              <input
                type="password"
                value={steadfastApiKey}
                onChange={(e) => setSteadfastApiKey(e.target.value)}
                placeholder="sf_api_key_xxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Steadfast Secret-Key</label>
              <input
                type="password"
                value={steadfastSecretKey}
                onChange={(e) => setSteadfastSecretKey(e.target.value)}
                placeholder="sf_secret_key_xxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Pathao Express Credentials Card */}
        <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100 space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-red-900">Pathao Express Credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pathao Client ID</label>
              <input
                type="password"
                value={pathaoClientId}
                onChange={(e) => setPathaoClientId(e.target.value)}
                placeholder="pth_client_id_xxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pathao Client Secret</label>
              <input
                type="password"
                value={pathaoClientSecret}
                onChange={(e) => setPathaoClientSecret(e.target.value)}
                placeholder="pth_client_secret_xxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>
        </div>

        {/* Save Settings Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
          >
            {isLoading ? (
              <span>Saving Configurations...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Store Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
