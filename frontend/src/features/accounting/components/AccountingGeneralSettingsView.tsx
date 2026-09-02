'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Globe,
  CircleDollarSign,
  Calendar,
  Info,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Zap,
  FileEdit,
} from 'lucide-react';
import {
  useGetAccountingSettingsQuery,
  useUpdateAccountingSettingsMutation,
} from '../api/accountingApi';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** The month name that ends a fiscal year starting on `startMonth` (1-12). */
function fiscalYearEndLabel(startMonth: number): string {
  const endIndex = (startMonth + 10) % 12; // month before start, 0-indexed
  return MONTHS[endIndex];
}

export function AccountingGeneralSettingsView() {
  const { data: settings, isLoading, isFetching } = useGetAccountingSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateAccountingSettingsMutation();

  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState(7);
  const [autoPostEnabled, setAutoPostEnabled] = useState(true);
  const [allowDraftEntries, setAllowDraftEntries] = useState(true);

  useEffect(() => {
    if (!settings) return;
    setFiscalYearStartMonth(settings.fiscalYearStartMonth);
    setAutoPostEnabled(settings.autoPostEnabled);
    setAllowDraftEntries(settings.allowDraftEntries);
  }, [settings]);

  const isDirty = useMemo(() => {
    if (!settings) return false;
    return (
      settings.fiscalYearStartMonth !== fiscalYearStartMonth ||
      settings.autoPostEnabled !== autoPostEnabled ||
      settings.allowDraftEntries !== allowDraftEntries
    );
  }, [settings, fiscalYearStartMonth, autoPostEnabled, allowDraftEntries]);

  const handleSave = async () => {
    try {
      await updateSettings({
        fiscalYearStartMonth,
        autoPostEnabled,
        allowDraftEntries,
      }).unwrap();
      toast.success('Settings saved');
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to save settings.';
      toast.error(message);
    }
  };

  const handleReset = () => {
    if (!settings) return;
    setFiscalYearStartMonth(settings.fiscalYearStartMonth);
    setAutoPostEnabled(settings.autoPostEnabled);
    setAllowDraftEntries(settings.allowDraftEntries);
    toast.info('Unsaved changes reverted.');
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6 w-full pb-10">
        <div className="h-8 w-52 bg-slate-100 rounded-lg animate-pulse" />
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 sm:p-8 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
              <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1">
          <Link href="/dashboard/accounting/settings/general" className="text-blue-600 hover:underline">
            Settings
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600">General</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">General Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your basic accounting preferences.</p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 sm:p-8 space-y-8">
        {/* Section 1: Currency */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Currency</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-6">Your base currency for accounting.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-1">
            <div className="lg:col-span-6">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Base Currency</label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.baseCurrency}
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-blue-50/60 border border-blue-100/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <p>All accounting transactions will be recorded in this currency.</p>
                  <p className="text-slate-500">This setting cannot be changed later.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Financial Year */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Financial Year</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-6">Define the month your financial year starts on.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-1">
            <div className="lg:col-span-6">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Financial Year Start
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <select
                  value={fiscalYearStartMonth}
                  onChange={(e) => setFiscalYearStartMonth(Number(e.target.value))}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {MONTHS.map((label, i) => (
                    <option key={label} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-blue-50/60 border border-blue-100/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-700">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <p>
                    Your financial year will start in {MONTHS[fiscalYearStartMonth - 1]} and end in{' '}
                    {fiscalYearEndLabel(fiscalYearStartMonth)}.
                  </p>
                  <p className="text-slate-500">
                    Change this only at the beginning of a new financial year.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Posting Behaviour */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Posting Behaviour</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 ml-6">
              Control how journal entries are created across the platform.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer hover:bg-slate-50/60 transition">
              <input
                type="checkbox"
                checked={autoPostEnabled}
                onChange={(e) => setAutoPostEnabled(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  Auto-post journal entries
                </span>
                <span className="block text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Let order settlement, courier cost and gateway fees post balanced entries
                  automatically. When off, only manual entries and expenses post.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer hover:bg-slate-50/60 transition">
              <input
                type="checkbox"
                checked={allowDraftEntries}
                onChange={(e) => setAllowDraftEntries(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <FileEdit className="w-3.5 h-3.5 text-blue-600" />
                  Allow draft journal entries
                </span>
                <span className="block text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Permit saving journal entries as drafts. When off, every entry must post
                  immediately.
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isFetching || !isDirty}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || isSaving}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
