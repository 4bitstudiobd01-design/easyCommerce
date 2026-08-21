'use client';

import React from 'react';
import {
  Palette,
  Mail,
  CreditCard,
  Bell,
  UserPlus,
  Shield,
  Wrench,
  Sliders,
  Sparkles,
  Upload,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { SettingsTab } from './types';

interface OtherSettingsTabsProps {
  activeTab: SettingsTab;
}

export function OtherSettingsTabs({ activeTab }: OtherSettingsTabsProps) {
  if (activeTab === 'General') return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
      {/* Tab: Branding */}
      {activeTab === 'Branding' && (
        <div className="space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Branding & Visual Identity
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize logos, favicons, primary brand colors and merchant storefront badges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Primary Logo */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-3">
              <label className="block font-bold text-slate-700">Platform Logo (Light Mode)</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border border-dashed border-slate-300">
                  <Palette className="w-6 h-6 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={() => toast.info('Upload logo file')}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Upload New Logo
                </button>
              </div>
            </div>

            {/* Brand Colors */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-3">
              <label className="block font-bold text-slate-700">Primary Brand Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  defaultValue="#059669"
                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                />
                <input
                  type="text"
                  defaultValue="#059669 (Emerald Green)"
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Email */}
      {activeTab === 'Email' && (
        <div className="space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              SMTP & Email Delivery Settings
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure outgoing transactional mail service for alerts, invoices, and password resets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">SMTP Host</label>
              <input
                type="text"
                defaultValue="smtp.mailgun.org"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SMTP Port</label>
              <input
                type="text"
                defaultValue="587 (TLS)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Sender Name</label>
              <input
                type="text"
                defaultValue="EasyCommerce Notifications"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Sender Email</label>
              <input
                type="email"
                defaultValue="no-reply@easycommerce.com"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Payments */}
      {activeTab === 'Payments' && (
        <div className="space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Platform Payment Gateway Integrations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage supported payment methods for merchant subscription billing and fee splits.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { name: 'bKash PGW (Direct API v1.2.0-beta)', fee: '1.5%', status: 'Active' },
              { name: 'Nagad Checkout API', fee: '1.2%', status: 'Active' },
              { name: 'SSLCommerz Hosted Gateway', fee: '2.0%', status: 'Active' },
              { name: 'Stripe Global (Visa/Mastercard)', fee: '2.9% + 30¢', status: 'Test Mode' },
            ].map((gw) => (
              <div
                key={gw.name}
                className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-800">{gw.name}</h4>
                  <span className="text-[11px] text-slate-400">Processing Fee: {gw.fee}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {gw.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'Security' && (
        <div className="space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Platform Security & Access Policies
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforce session timeouts, password complexity rules, and IP whitelisting.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl">
              <div>
                <h4 className="font-bold text-slate-800">Admin Session Inactivity Timeout</h4>
                <p className="text-[11px] text-slate-400">Automatically logout inactive admin sessions</p>
              </div>
              <span className="font-semibold text-slate-700">30 Minutes</span>
            </div>

            <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl">
              <div>
                <h4 className="font-bold text-slate-800">Rate Limiting for Public API Endpoints</h4>
                <p className="text-[11px] text-slate-400">Prevent DDoS and brute force credential attacks</p>
              </div>
              <span className="font-semibold text-emerald-600">Enabled (100 req/min)</span>
            </div>
          </div>
        </div>
      )}

      {/* Fallback for other tabs */}
      {['Notifications', 'Registration', 'Features', 'Maintenance', 'Advanced'].includes(activeTab) && (
        <div className="space-y-4 text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">{activeTab} Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure parameters and behavior for {activeTab.toLowerCase()}.
            </p>
          </div>
          <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-500 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-emerald-600" />
            <p className="font-semibold text-slate-700">{activeTab} settings are up to date and active.</p>
            <p className="text-[11px] text-slate-400">All configurations synchronize automatically with production instances.</p>
          </div>
        </div>
      )}
    </div>
  );
}
