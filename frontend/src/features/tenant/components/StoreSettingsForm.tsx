'use client';

import React, { useState, useEffect } from 'react';
import { Store, useUpdateStoreMutation } from '../api/tenantApi';
import {
  Settings,
  Truck,
  Key,
  CheckCircle2,
  Save,
  Store as StoreIcon,
  ShieldCheck,
  Globe,
  ExternalLink,
  MessageSquare,
  Mail,
  ChevronRight,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface StoreSettingsFormProps {
  store: Store | null;
}

type ConfigAppType = 'domain' | 'profile' | 'courier' | 'sms' | 'email';

export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const [activeApp, setActiveApp] = useState<ConfigAppType | null>('domain');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [domain, setDomain] = useState('');
  const [steadfastApiKey, setSteadfastApiKey] = useState('');
  const [steadfastSecretKey, setSteadfastSecretKey] = useState('');
  const [pathaoClientId, setPathaoClientId] = useState('');
  const [pathaoClientSecret, setPathaoClientSecret] = useState('');

  // Notification Drivers State
  const [smsDriver, setSmsDriver] = useState<'BULKSMSBD' | 'GREENWEB' | 'TWILIO' | 'DISABLED'>('BULKSMSBD');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsSenderId, setSmsSenderId] = useState('');
  const [emailDriver, setEmailDriver] = useState<'SMTP' | 'SENDGRID' | 'DISABLED'>('SMTP');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [fromEmail, setFromEmail] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setPhone(store.phone || '');
      setAddress(store.address || '');
      setDomain(store.domain || '');
      setSteadfastApiKey(store.steadfastApiKey || '');
      setSteadfastSecretKey(store.steadfastSecretKey || '');
      setPathaoClientId(store.pathaoClientId || '');
      setPathaoClientSecret(store.pathaoClientSecret || '');

      setSmsDriver((store as any).smsDriver || 'BULKSMSBD');
      setSmsApiKey((store as any).smsApiKey || '');
      setSmsSenderId((store as any).smsSenderId || '');
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
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateStore({
        name,
        phone,
        address,
        domain: domain || undefined,
        steadfastApiKey: steadfastApiKey || undefined,
        steadfastSecretKey: steadfastSecretKey || undefined,
        pathaoClientId: pathaoClientId || undefined,
        pathaoClientSecret: pathaoClientSecret || undefined,
        smsDriver,
        smsApiKey: smsApiKey || undefined,
        smsSenderId: smsSenderId || undefined,
        emailDriver,
        smtpHost: smtpHost || undefined,
        smtpPort: Number(smtpPort) || 587,
        smtpUser: smtpUser || undefined,
        smtpPass: smtpPass || undefined,
        fromEmail: fromEmail || undefined,
      } as any).unwrap();

      setSuccessMsg('Configurations saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to save configurations.');
    }
  };

  const appIcons = [
    {
      id: 'domain',
      name: 'Subdomain & Domain',
      subtitle: store?.slug ? `${store.slug}.easycommerce.app` : 'Domain Router',
      icon: Globe,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Active',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'profile',
      name: 'Store Profile',
      subtitle: store?.name || 'Merchant Identity',
      icon: StoreIcon,
      color: 'from-purple-600 to-indigo-600',
      badge: 'Verified',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'courier',
      name: 'Courier Partners',
      subtitle: 'Steadfast & Pathao API Keys',
      icon: Truck,
      color: 'from-emerald-600 to-teal-600',
      badge: '2 Drivers',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'sms',
      name: 'SMS Notifications',
      subtitle: `${smsDriver} Driver`,
      icon: MessageSquare,
      color: 'from-blue-500 to-cyan-600',
      badge: smsDriver,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'email',
      name: 'Email Gateway',
      subtitle: `${emailDriver} Driver`,
      icon: Mail,
      color: 'from-amber-500 to-orange-600',
      badge: emailDriver,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Alert Notifications */}
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

      {/* 📱 SMARTPHONE APP STORE GRID SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base text-slate-900">Control Center Mobile App Store</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Click an app icon to configure settings</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {appIcons.map((app) => {
            const Icon = app.icon;
            const isSelected = activeApp === app.id;

            return (
              <button
                key={app.id}
                type="button"
                onClick={() => setActiveApp(app.id as ConfigAppType)}
                className={`p-5 rounded-3xl border text-left flex flex-col justify-between transition-all duration-200 group relative ${
                  isSelected
                    ? 'bg-white border-blue-600 ring-4 ring-blue-600/15 shadow-xl scale-[1.03]'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md hover:-translate-y-1'
                }`}
              >
                {/* App Icon Tile */}
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${app.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-3`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* App Info */}
                <div className="space-y-1">
                  <span className="font-extrabold text-xs text-slate-900 block truncate">
                    {app.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate font-mono">
                    {app.subtitle}
                  </span>
                </div>

                {/* App Status Badge */}
                <span
                  className={`mt-3 px-2 py-0.5 font-extrabold text-[9px] rounded-full border inline-block w-fit ${app.badgeColor}`}
                >
                  {app.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🛠️ ACTIVE APP CONFIGURATION CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 relative transition-all">
        {/* APP 1: SUBDOMAIN & CUSTOM DOMAIN */}
        {activeApp === 'domain' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Subdomain & Custom Domain Router</h3>
                  <p className="text-xs text-slate-400">Live Store Address & Custom CNAME setup</p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Assigned Store Subdomain
                </label>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-600 text-xs">
                    {store?.slug ? `${store.slug}.easycommerce.app` : 'setting-up...'}
                  </span>
                  {store?.slug && (
                    <Link
                      href={`/store/${store.slug}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-700 p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Test Storefront"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Custom Domain (CNAME Record)
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. www.sumonfashion.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-slate-700 flex items-center justify-between">
              <span className="font-medium">Local Subdomain Test: <code className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">http://{store?.slug || 'store'}.localhost:3000</code></span>
              {store?.slug && (
                <a
                  href={`http://${store.slug}.localhost:3000`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-600 hover:underline text-xs flex items-center gap-1"
                >
                  <span>Test Now</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* APP 2: STORE PROFILE */}
        {activeApp === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md">
                <StoreIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Store Profile Configuration</h3>
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
            </div>
          </div>
        )}

        {/* APP 3: COURIER DRIVERS */}
        {activeApp === 'courier' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Courier Partner Drivers</h3>
                  <p className="text-xs text-slate-400">Configure your Steadfast & Pathao merchant credentials</p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Encrypted Keys</span>
              </span>
            </div>

            {/* Steadfast Courier Card */}
            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
              <span className="font-extrabold text-xs text-blue-900 block">Steadfast Courier Credentials</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
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

            {/* Pathao Express Card */}
            <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100 space-y-4">
              <span className="font-extrabold text-xs text-red-900 block">Pathao Express Credentials</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
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
          </div>
        )}

        {/* APP 4: SMS DRIVER */}
        {activeApp === 'sms' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-blue-500 to-cyan-600 text-white rounded-2xl shadow-md">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">SMS Notification Driver</h3>
                  <p className="text-xs text-slate-400">Select active SMS gateway adapter & credentials</p>
                </div>
              </div>

              <select
                value={smsDriver}
                onChange={(e) => setSmsDriver(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="BULKSMSBD">BulkSMSBD Driver (Active)</option>
                <option value="GREENWEB">Greenweb SMS Driver</option>
                <option value="TWILIO">Twilio SMS Driver</option>
                <option value="DISABLED">Disable SMS Gateway</option>
              </select>
            </div>

            {smsDriver !== 'DISABLED' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SMS Gateway API Key</label>
                  <input
                    type="password"
                    value={smsApiKey}
                    onChange={(e) => setSmsApiKey(e.target.value)}
                    placeholder="Enter BulkSMSBD / Greenweb API Key"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sender ID (Masking)</label>
                  <input
                    type="text"
                    value={smsSenderId}
                    onChange={(e) => setSmsSenderId(e.target.value)}
                    placeholder="e.g. EASYSTORE"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* APP 5: EMAIL DRIVER */}
        {activeApp === 'email' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 text-white rounded-2xl shadow-md">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Email Gateway Driver</h3>
                  <p className="text-xs text-slate-400">Configure SMTP or SendGrid mail server</p>
                </div>
              </div>

              <select
                value={emailDriver}
                onChange={(e) => setEmailDriver(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="SMTP">SMTP Email Driver (Active)</option>
                <option value="SENDGRID">SendGrid Email Driver</option>
                <option value="DISABLED">Disable Email Gateway</option>
              </select>
            </div>

            {emailDriver !== 'DISABLED' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.mailtrap.io"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">From Sender Email</label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="no-reply@store.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save Settings Action Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
          >
            {isLoading ? (
              <span>Saving App Settings...</span>
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
