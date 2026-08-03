'use client';

import React, { useState, useEffect } from 'react';
import { Store, useUpdateStoreMutation } from '../api/tenantApi';
import { ThemeCustomizerApp } from './ThemeCustomizerApp';
import { ThemeMarketplaceApp } from './ThemeMarketplaceApp';
import {
  Store as StoreIcon,
  Link2,
  FileText,
  Truck,
  CreditCard,
  Globe,
  MessageSquare,
  Mail,
  Share2,
  ShieldBan,
  Sliders,
  ArrowLeft,
  CheckCircle2,
  Save,
  ExternalLink,
  ShieldCheck,
  Palette,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { OgShareCardPreviewModal } from '@/features/seo/components/OgShareCardPreviewModal';

interface StoreSettingsFormProps {
  store: Store | null;
  initialActiveCard?: ManageShopCardType | null;
}

type ManageShopCardType =
  | 'settings'
  | 'domain'
  | 'policy'
  | 'delivery'
  | 'payment'
  | 'seo'
  | 'sms'
  | 'email'
  | 'theme'
  | 'blocklist'
  | 'limits';

export function StoreSettingsForm({ store, initialActiveCard }: StoreSettingsFormProps) {
  const [activeCard, setActiveCard] = useState<ManageShopCardType | null>(initialActiveCard || null);
  const [isOgModalOpen, setIsOgModalOpen] = useState(false);

  useEffect(() => {
    if (initialActiveCard !== undefined) {
      setActiveCard(initialActiveCard);
    }
  }, [initialActiveCard]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [domain, setDomain] = useState('');
  const [facebookPixelId, setFacebookPixelId] = useState('');
  const [facebookCapiToken, setFacebookCapiToken] = useState('');
  const [facebookTestEventCode, setFacebookTestEventCode] = useState('');
  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [googleTagManagerId, setGoogleTagManagerId] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [snapchatPixelId, setSnapchatPixelId] = useState('');
  const [pinterestTagId, setPinterestTagId] = useState('');
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

  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setPhone(store.phone || '');
      setAddress(store.address || '');
      setDomain(store.domain || '');
      setFacebookPixelId(store.facebookPixelId || '');
      setFacebookCapiToken(store.facebookCapiToken || '');
      setFacebookTestEventCode(store.facebookTestEventCode || '');
      setTiktokPixelId(store.tiktokPixelId || '');
      setGoogleTagManagerId(store.googleTagManagerId || '');
      setGoogleAnalyticsId((store as any).googleAnalyticsId || '');
      setSnapchatPixelId((store as any).snapchatPixelId || '');
      setPinterestTagId((store as any).pinterestTagId || '');
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

    try {
      await updateStore({
        name,
        phone,
        address,
        domain: domain || undefined,
        facebookPixelId: facebookPixelId || undefined,
        facebookCapiToken: facebookCapiToken || undefined,
        facebookTestEventCode: facebookTestEventCode || undefined,
        tiktokPixelId: tiktokPixelId || undefined,
        googleTagManagerId: googleTagManagerId || undefined,
        googleAnalyticsId: googleAnalyticsId || undefined,
        snapchatPixelId: snapchatPixelId || undefined,
        pinterestTagId: pinterestTagId || undefined,
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

      toast.success('Configurations saved successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save configurations.');
    }
  };

  const shopCards = [
    {
      id: 'settings',
      title: 'Shop Settings',
      description: "General shop configurations customize your shop's core settings for a seamless experience.",
      icon: StoreIcon,
      badge: null,
      iconColor: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'domain',
      title: 'Shop Domain',
      description: "Manage your shop's core configurations, including domain setup and general settings.",
      icon: Link2,
      badge: null,
      iconColor: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'theme',
      title: 'Theme & Branding',
      description: 'Customize primary accent colors, font typography, logo, favicon, and hero slider banners.',
      icon: Palette,
      badge: 'New',
      iconColor: 'text-pink-600 bg-pink-50',
    },
    {
      id: 'delivery',
      title: 'Delivery Support',
      description: 'Manage your shop delivery settings to ensure smooth and efficient order fulfillment.',
      icon: Truck,
      badge: null,
      iconColor: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'payment',
      title: 'Payment Gateway',
      description: 'Integrate and manage payment options to provide customers with secure and flexible transaction methods.',
      icon: CreditCard,
      badge: null,
      iconColor: 'text-emerald-600 bg-emerald-50',
    },
    {
      id: 'seo',
      title: 'SEO & Marketing Integrations',
      description: 'Enhance your shop visibility by Google Tag Manager, Facebook Pixel, TikTok Pixel, and SEO tools.',
      icon: Globe,
      badge: 'New',
      iconColor: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'sms',
      title: 'SMS Support',
      description: 'Enable SMS notifications and support to keep your customers informed with real-time updates.',
      icon: MessageSquare,
      badge: null,
      iconColor: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'email',
      title: 'Email Gateway',
      description: 'Provide instant communication and transactional invoice assistance with SMTP & SendGrid.',
      icon: Mail,
      badge: null,
      iconColor: 'text-amber-600 bg-amber-50',
    },
    {
      id: 'policy',
      title: 'Shop Policy',
      description: 'Define and customize policies for your shop, including returns, refunds, and customer service guidelines.',
      icon: FileText,
      badge: null,
      iconColor: 'text-slate-700 bg-slate-100',
    },
    {
      id: 'blocklist',
      title: 'Blocklist',
      description: 'Block abusive visitors by IP address, IP range, device, country, phone, or email to stop fraud.',
      icon: ShieldBan,
      badge: 'New',
      iconColor: 'text-red-600 bg-red-50',
    },
    {
      id: 'limits',
      title: 'Order Limits',
      description: 'Limit repeat and duplicate orders, choose how they are handled, and review protected attempts.',
      icon: Sliders,
      badge: 'New',
      iconColor: 'text-indigo-600 bg-indigo-50',
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl">
      {/* HUB GRID VIEW (WHEN NO CARD IS SELECTED) */}
      {!activeCard ? (
        <div className="space-y-6">
          {/* Top Title Banner */}
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manage Shop</h2>
            <p className="text-xs text-slate-500 font-normal">
              Set up and customize your shop to ensure a smooth and efficient experience.
            </p>
          </div>

          {/* 3-Column Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shopCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.id}
                  onClick={() => setActiveCard(card.id as ManageShopCardType)}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-purple-400 transition-all cursor-pointer group flex flex-col justify-between space-y-4 relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-2xl ${card.iconColor} shadow-sm group-hover:scale-105 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {card.badge && (
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-[10px] rounded-full shadow-sm">
                          {card.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-purple-600 transition-colors">
                      {card.title}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* DETAIL CONFIGURATOR VIEW (WHEN A CARD IS SELECTED) */
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => setActiveCard(null)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>← Back to Manage Shop</span>
          </button>

          {/* CARD DETAIL 1: SHOP SETTINGS */}
          {activeCard === 'settings' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                  <StoreIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Shop Settings & Profile</h3>
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Shop Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* CARD DETAIL 2: SHOP DOMAIN */}
          {activeCard === 'domain' && (
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
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Custom Domain (Optional CNAME)
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

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Domain Configuration</span>
                </button>
              </div>
            </div>
          )}

          {/* CARD DETAIL 3: THEME & BRANDING */}
          {activeCard === 'theme' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <ThemeCustomizerApp store={store} />
            </div>
          )}

          {/* CARD DETAIL 4: DELIVERY SUPPORT */}
          {activeCard === 'delivery' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Delivery Support & Courier API Keys</h3>
                    <p className="text-xs text-slate-400">Steadfast Courier & Pathao Express merchant credentials</p>
                  </div>
                </div>
              </div>

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

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Delivery Credentials</span>
                </button>
              </div>
            </div>
          )}

          {/* CARD DETAIL 5: PAYMENT GATEWAY */}
          {activeCard === 'payment' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Payment Gateway Integration</h3>
                  <p className="text-xs text-slate-400">SSLCommerz, bKash & Cash on Delivery (COD) settings</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-2">
                <span className="font-extrabold text-xs block">Active Gateways:</span>
                <p>✅ Cash on Delivery (COD) - Auto Enabled for Dhaka & Outside Dhaka</p>
                <p>✅ SSLCommerz Online Payment - Configured via Platform Sandbox Gateway</p>
              </div>
            </div>
          )}

          {/* CARD DETAIL 6: SMS SUPPORT */}
          {activeCard === 'sms' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">SMS Notification Driver</h3>
                    <p className="text-xs text-slate-400">BulkSMSBD, Greenweb, Twilio SMS adapters</p>
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

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save SMS Configuration</span>
                </button>
              </div>
            </div>
          )}

          {/* CARD DETAIL 7: EMAIL GATEWAY */}
          {activeCard === 'email' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
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

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Email Configuration</span>
                </button>
              </div>
            </div>
          )}

          {/* CARD DETAIL 6: SEO & MARKETING PIXEL INTEGRATIONS */}
          {activeCard === 'seo' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">SEO, OpenGraph Cards &amp; Marketing Pixels</h3>
                    <p className="text-xs text-slate-400">Track customer conversion events, retargeting &amp; Google Search rich snippets</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOgModalOpen(true)}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-purple-600/20 shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Preview Social OpenGraph Card</span>
                </button>
              </div>

              {/* Social OpenGraph Preview Modal */}
              <OgShareCardPreviewModal
                isOpen={isOgModalOpen}
                onClose={() => setIsOgModalOpen(false)}
                title={store?.metaTitle || `${name || store?.name} | Official Storefront`}
                description={store?.metaDescription || `Shop authentic products and fast delivery from ${name || store?.name}.`}
                image={store?.logo || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
                url={`https://${store?.slug || 'store'}.easycommerce.app`}
                storeName={name || store?.name}
              />

              {/* Meta / Facebook Pixel Box */}
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                <span className="font-extrabold text-xs text-blue-900 block">🔵 Meta (Facebook) Pixel & Conversions API (CAPI)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Meta Pixel ID</label>
                    <input
                      type="text"
                      value={facebookPixelId}
                      onChange={(e) => setFacebookPixelId(e.target.value)}
                      placeholder="e.g. 123456789012345"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CAPI Test Event Code (Optional)</label>
                    <input
                      type="text"
                      value={facebookTestEventCode}
                      onChange={(e) => setFacebookTestEventCode(e.target.value)}
                      placeholder="e.g. TEST12345"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Meta Conversions API Access Token (CAPI)</label>
                    <textarea
                      value={facebookCapiToken}
                      onChange={(e) => setFacebookCapiToken(e.target.value)}
                      placeholder="EAAG..."
                      rows={2}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* TikTok Pixel Box */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
                <span className="font-extrabold text-xs block text-cyan-400">🎵 TikTok Pixel ID</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-300 mb-1">TikTok Pixel ID</label>
                    <input
                      type="text"
                      value={tiktokPixelId}
                      onChange={(e) => setTiktokPixelId(e.target.value)}
                      placeholder="e.g. C1234567890"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Google Analytics 4 (GA4) & GTM Box */}
              <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                <span className="font-extrabold text-xs text-emerald-900 block">📊 Google Analytics 4 (GA4) & Google Tag Manager (GTM)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GA4 Measurement ID</label>
                    <input
                      type="text"
                      value={googleAnalyticsId}
                      onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                      placeholder="e.g. G-1234567890"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GTM Container ID</label>
                    <input
                      type="text"
                      value={googleTagManagerId}
                      onChange={(e) => setGoogleTagManagerId(e.target.value)}
                      placeholder="e.g. GTM-XXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Snapchat & Pinterest Box */}
              <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-4">
                <span className="font-extrabold text-xs text-amber-900 block">👻 Snapchat Pixel & 📌 Pinterest Tag</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Snapchat Pixel ID</label>
                    <input
                      type="text"
                      value={snapchatPixelId}
                      onChange={(e) => setSnapchatPixelId(e.target.value)}
                      placeholder="e.g. snap_pixel_123"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pinterest Tag ID</label>
                    <input
                      type="text"
                      value={pinterestTagId}
                      onChange={(e) => setPinterestTagId(e.target.value)}
                      placeholder="e.g. pin_tag_456"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE AUTO-GENERATED PRODUCT CATALOG FEEDS FOR GOOGLE & META ADS */}
              <div className="p-5 bg-purple-900 text-white rounded-2xl border border-purple-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span className="font-extrabold text-xs text-purple-200 uppercase tracking-wider">
                    Automated Product Catalog Sync Feeds (Google & Meta Ads)
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-300 mb-1">
                      🛒 Google Merchant Center Shopping RSS Feed URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`http://localhost:5001/api/v1/stores/slug/${store?.slug || 'my-shop'}/feed/google-shopping.xml`}
                        className="w-full px-3.5 py-2 bg-purple-950 border border-purple-700 rounded-xl text-purple-200 font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`http://localhost:5001/api/v1/stores/slug/${store?.slug || 'my-shop'}/feed/google-shopping.xml`);
                          toast.success('Google Shopping RSS Feed URL copied to clipboard!');
                        }}
                        className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shrink-0 transition-colors"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-300 mb-1">
                      📦 Facebook Commerce Manager Catalog CSV Feed URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`http://localhost:5001/api/v1/stores/slug/${store?.slug || 'my-shop'}/feed/facebook-catalog.csv`}
                        className="w-full px-3.5 py-2 bg-purple-950 border border-purple-700 rounded-xl text-purple-200 font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`http://localhost:5001/api/v1/stores/slug/${store?.slug || 'my-shop'}/feed/facebook-catalog.csv`);
                          toast.success('Facebook Catalog CSV Feed URL copied to clipboard!');
                        }}
                        className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shrink-0 transition-colors"
                      >
                        Copy URL
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Marketing & Pixel Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* CARD DETAIL: THEME MARKETPLACE */}
          {activeCard === 'theme' && (
            <div className="space-y-6">
              <ThemeMarketplaceApp store={store} />
              <div className="pt-8 border-t border-slate-200">
                <h3 className="font-extrabold text-lg text-slate-900 mb-4">Fine-Tune Active Theme Branding &amp; Banners</h3>
                <ThemeCustomizerApp store={store} />
              </div>
            </div>
          )}

          {/* CARD DETAIL 7-11: PLACEHOLDERS FOR POLICY, BLOCKLIST, LIMITS */}
          {['policy', 'blocklist', 'limits'].includes(activeCard) && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4 text-center py-12">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-purple-100">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                {shopCards.find((c) => c.id === activeCard)?.title} Configurator
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {shopCards.find((c) => c.id === activeCard)?.description}
              </p>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
