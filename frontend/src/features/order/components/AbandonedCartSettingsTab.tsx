'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Bell,
  Percent,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Save,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export const AbandonedCartSettingsTab: React.FC = () => {
  const [autoSmsEnabled, setAutoSmsEnabled] = useState(true);
  const [firstDelay, setFirstDelay] = useState('1h');
  const [secondSmsEnabled, setSecondSmsEnabled] = useState(true);
  const [secondDelay, setSecondDelay] = useState('24h');
  const [discountEnabled, setDiscountEnabled] = useState(true);
  const [discountCode, setDiscountCode] = useState('COMEBACK10');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [selectedGateway, setSelectedGateway] = useState('greenweb');
  const [senderId, setSenderId] = useState('EASYCOMMERCE');
  const [maxReminders, setMaxReminders] = useState('2');
  const [cartExpiryDays, setCartExpiryDays] = useState('14');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Abandoned cart recovery settings saved successfully!');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* HEADER BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            Abandoned Cart Automation & Recovery Settings
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Configure automated dispatch schedules, discount incentives, and SMS gateway credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. AUTOMATION RULES (2 COLS) */}
        <div className="lg:col-span-2 space-y-5">
          {/* RULE 1: FIRST REMINDER */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  Primary Automated SMS Reminder
                </h4>
                <p className="text-xs text-slate-500">
                  Automatically send a friendly reminder when a customer leaves items in checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAutoSmsEnabled(!autoSmsEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoSmsEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                aria-label="Toggle auto SMS"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoSmsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {autoSmsEnabled && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Trigger Delay After Abandonment
                  </label>
                  <select
                    value={firstDelay}
                    onChange={(e) => setFirstDelay(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="30m">30 Minutes (Recommended)</option>
                    <option value="1h">1 Hour</option>
                    <option value="2h">2 Hours</option>
                    <option value="4h">4 Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Template To Dispatch
                  </label>
                  <select className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="tmpl-1h">1-Hour Quick Reminder</option>
                    <option value="tmpl-bangla-native">Bangla Direct Friendly SMS</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* RULE 2: SECOND REMINDER WITH DISCOUNT */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-500" />
                  Secondary Follow-Up with Discount Incentive
                </h4>
                <p className="text-xs text-slate-500">
                  Send a second reminder with a promo code if the cart remains unpurchased.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSecondSmsEnabled(!secondSmsEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  secondSmsEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                aria-label="Toggle second SMS"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    secondSmsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {secondSmsEnabled && (
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Follow-up Delay
                    </label>
                    <select
                      value={secondDelay}
                      onChange={(e) => setSecondDelay(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="12h">12 Hours</option>
                      <option value="24h">24 Hours (Recommended)</option>
                      <option value="48h">48 Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Auto-Attach Promo Code
                    </label>
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-900">
                    Discount Percentage to Apply:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-16 h-8 px-2 bg-white border border-amber-200 rounded-lg text-center font-bold text-slate-800 text-xs"
                    />
                    <span className="font-bold text-amber-900">% OFF</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GENERAL CONSTRAINTS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Safety Limits & Abandonment Thresholds
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Max Reminders Per Customer
                </label>
                <select
                  value={maxReminders}
                  onChange={(e) => setMaxReminders(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="1">1 Reminder Only</option>
                  <option value="2">2 Reminders (Recommended)</option>
                  <option value="3">3 Reminders</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Expire Unrecovered Cart After
                </label>
                <select
                  value={cartExpiryDays}
                  onChange={(e) => setCartExpiryDays(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SMS GATEWAY SETTINGS (1 COL) */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                SMS Gateway Provider
              </h4>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: 'greenweb',
                  name: 'Greenweb BD Gateway',
                  badge: 'Connected',
                  balance: '৳1,420.50 (2,841 SMS)',
                  isPrimary: true,
                },
                {
                  id: 'ssl',
                  name: 'SSL Wireless SMS',
                  badge: 'Available',
                  balance: 'Configure API Key',
                  isPrimary: false,
                },
                {
                  id: 'bulksms',
                  name: 'BulkSMS BD',
                  badge: 'Available',
                  balance: 'Configure API Key',
                  isPrimary: false,
                },
              ].map((gw) => (
                <div
                  key={gw.id}
                  onClick={() => setSelectedGateway(gw.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedGateway === gw.id
                      ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">{gw.name}</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                      {gw.balance}
                    </p>
                  </div>
                  {selectedGateway === gw.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                Sender ID / Masking Name
              </label>
              <input
                type="text"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                placeholder="EASYCOMMERCE"
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
              <p className="text-[10px] text-slate-400">
                Requires BTRC approved non-masking/masking sender ID.
              </p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-100/80 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              Pro Recovery Tip
            </h5>
            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
              Over 68% of Bangladeshi shoppers respond within 2 hours of cart abandonment when an SMS is sent with a direct one-click checkout link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
