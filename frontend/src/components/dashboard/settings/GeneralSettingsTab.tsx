'use client';

import React from 'react';
import {
  ExternalLink,
  AlertTriangle,
  Trash2,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { GeneralSettings } from './types';

interface GeneralSettingsTabProps {
  settings: GeneralSettings;
  onChange: (key: keyof GeneralSettings, value: any) => void;
  onClearCache: () => void;
  onResetSettings: () => void;
}

export function GeneralSettingsTab({
  settings,
  onChange,
  onClearCache,
  onResetSettings,
}: GeneralSettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* 1. Top Row (2 Cards: Platform Information & Business Information) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ======================================================== */}
        {/* CARD 1: PLATFORM INFORMATION */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
            Platform Information
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Platform Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => onChange('platformName', e.target.value)}
                placeholder="e.g. EasyCommerce"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tagline (Optional)
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => onChange('tagline', e.target.value)}
                placeholder="e.g. All-in-one eCommerce Platform"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>

            {/* Platform Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Platform Description
              </label>
              <textarea
                rows={3}
                value={settings.platformDescription}
                onChange={(e) => onChange('platformDescription', e.target.value)}
                placeholder="Provide a brief description of the platform..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium resize-none leading-relaxed"
              />
            </div>

            {/* 2 Cols: Default Timezone & Default Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Timezone
                </label>
                <div className="relative">
                  <select
                    value={settings.defaultTimezone}
                    onChange={(e) => onChange('defaultTimezone', e.target.value)}
                    className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
                  >
                    <option value="(UTC+06:00) Dhaka, Bangladesh">
                      (UTC+06:00) Dhaka, Bangladesh
                    </option>
                    <option value="(UTC+00:00) UTC">
                      (UTC+00:00) UTC
                    </option>
                    <option value="(UTC-05:00) Eastern Time (US & Canada)">
                      (UTC-05:00) Eastern Time (US)
                    </option>
                    <option value="(UTC+01:00) London, UK">
                      (UTC+01:00) London, UK
                    </option>
                    <option value="(UTC+08:00) Singapore">
                      (UTC+08:00) Singapore
                    </option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Language
                </label>
                <div className="relative">
                  <select
                    value={settings.defaultLanguage}
                    onChange={(e) => onChange('defaultLanguage', e.target.value)}
                    className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Bengali (বাংলা)">Bengali (বাংলা)</option>
                    <option value="English (UK)">English (UK)</option>
                    <option value="Spanish (Español)">Spanish (Español)</option>
                    <option value="French (Français)">French (Français)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 2: BUSINESS INFORMATION */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
            Business Information
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => onChange('companyName', e.target.value)}
                placeholder="e.g. EasyCommerce Ltd."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>

            {/* Company Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Email
              </label>
              <input
                type="email"
                value={settings.companyEmail}
                onChange={(e) => onChange('companyEmail', e.target.value)}
                placeholder="support@easyco.com"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>

            {/* 2 Cols: Company Phone & Company Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Phone
                </label>
                <input
                  type="text"
                  value={settings.companyPhone}
                  onChange={(e) => onChange('companyPhone', e.target.value)}
                  placeholder="+880 1712-345678"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Website
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={settings.companyWebsite}
                    onChange={(e) => onChange('companyWebsite', e.target.value)}
                    placeholder="https://www.easyco.com"
                    className="w-full pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium"
                  />
                  <a
                    href={settings.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Company Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Address
              </label>
              <textarea
                rows={2}
                value={settings.companyAddress}
                onChange={(e) => onChange('companyAddress', e.target.value)}
                placeholder="House 23, Road 12, Banani, Dhaka 1213, Bangladesh"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CARD 3: REGIONAL & CURRENCY SETTINGS */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
          Regional & Currency Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Default Currency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Default Currency
            </label>
            <div className="relative">
              <select
                value={settings.defaultCurrency}
                onChange={(e) => onChange('defaultCurrency', e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="BDT (৳) - Bangladeshi Taka">
                  BDT (৳) - Bangladeshi Taka
                </option>
                <option value="USD ($) - US Dollar">
                  USD ($) - US Dollar
                </option>
                <option value="EUR (€) - Euro">
                  EUR (€) - Euro
                </option>
                <option value="GBP (£) - British Pound">
                  GBP (£) - British Pound
                </option>
                <option value="INR (₹) - Indian Rupee">
                  INR (₹) - Indian Rupee
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Currency Position */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Currency Position
            </label>
            <div className="relative">
              <select
                value={settings.currencyPosition}
                onChange={(e) => onChange('currencyPosition', e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="Before amount (৳1,000)">
                  Before amount (৳1,000)
                </option>
                <option value="After amount (1,000৳)">
                  After amount (1,000৳)
                </option>
                <option value="Before with space (৳ 1,000)">
                  Before with space (৳ 1,000)
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Decimal Format */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Decimal Format
            </label>
            <div className="relative">
              <select
                value={settings.decimalFormat}
                onChange={(e) => onChange('decimalFormat', e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="1,234.56">1,234.56</option>
                <option value="1.234,56">1.234,56</option>
                <option value="1234.56">1234.56</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CARD 4: SYSTEM DEFAULTS */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
          System Defaults
        </h3>

        {/* Row 1: 4 Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Default Plan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Default Plan for New Merchants
            </label>
            <div className="relative">
              <select
                value={settings.defaultPlan}
                onChange={(e) => onChange('defaultPlan', e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="Starter Plan">Starter Plan</option>
                <option value="Growth Plan">Growth Plan</option>
                <option value="Business Plan">Business Plan</option>
                <option value="Enterprise Plan">Enterprise Plan</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Default Store Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Default Store Status
            </label>
            <div className="relative">
              <select
                value={settings.defaultStoreStatus}
                onChange={(e) => onChange('defaultStoreStatus', e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="Pending Verification">Pending Verification</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Suspended">Suspended</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Default Order Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Default Order Status
            </label>
            <div className="relative">
              <select
                value={settings.defaultOrderStatus}
                onChange={(e) => onChange('defaultOrderStatus', e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Default Subscription Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Default Subscription Status
            </label>
            <div className="relative">
              <select
                value={settings.defaultSubscriptionStatus}
                onChange={(e) =>
                  onChange('defaultSubscriptionStatus', e.target.value)
                }
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Trial">Trial</option>
                <option value="Pending Payment">Pending Payment</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 2: 3 Columns (Export format, items per page, 2FA toggle) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 items-center text-xs">
          {/* Export Format */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Data Export Format
            </label>
            <div className="relative">
              <select
                value={settings.dataExportFormat}
                onChange={(e) => onChange('dataExportFormat', e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="CSV">CSV</option>
                <option value="Excel (XLSX)">Excel (XLSX)</option>
                <option value="JSON">JSON</option>
                <option value="PDF">PDF</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Items Per Page */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Items Per Page (Default)
            </label>
            <div className="relative">
              <select
                value={settings.itemsPerPage}
                onChange={(e) => onChange('itemsPerPage', Number(e.target.value))}
                className="w-full appearance-none pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2FA Switch Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Enable Two-Factor Authentication for Admins
            </label>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={settings.enable2FA}
                onClick={() => onChange('enable2FA', !settings.enable2FA)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.enable2FA ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.enable2FA ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs text-slate-600 font-medium">
                Require 2FA for all platform admin users
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CARD 5: DANGER ZONE */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-rose-200/80 shadow-2xs space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Danger Zone</span>
          </div>
          <p className="text-[11px] text-slate-500 font-normal mt-0.5">
            These actions are sensitive and can impact the entire platform.
          </p>
        </div>

        {/* 2 Danger Action Boxes Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Action Box 1: Clear Cache */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900">
                Clear Cache
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                Clear all platform cache including configurations, sessions and temporary data.
              </p>
            </div>

            <button
              type="button"
              onClick={onClearCache}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear Cache</span>
            </button>
          </div>

          {/* Action Box 2: Reset Platform Settings */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900">
                Reset Platform Settings
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                Reset all settings to default values. This action cannot be undone.
              </p>
            </div>

            <button
              type="button"
              onClick={onResetSettings}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>Reset Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
