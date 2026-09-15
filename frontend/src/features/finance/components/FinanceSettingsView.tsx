'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Settings,
  Save,
  Plus,
  RefreshCw,
  Tag,
  Percent,
  FileText,
  DollarSign,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  useGetFinanceSettingsQuery,
  useUpdateFinanceSettingsMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetPeriodLocksQuery,
  useLockPeriodMutation,
  useUnlockPeriodMutation,
  FinanceCategory,
  FinanceCategoryType,
} from '../api/financeApi';

export function FinanceSettingsView() {
  const { data: settings, isLoading, isFetching, refetch } = useGetFinanceSettingsQuery();
  const { data: categories, refetch: refetchCategories } = useGetCategoriesQuery();
  const { data: periodLocks, refetch: refetchLocks } = useGetPeriodLocksQuery();

  const categoryList: FinanceCategory[] = Array.isArray(categories) ? categories : [];
  const lockList = Array.isArray(periodLocks) ? periodLocks : [];

  const [updateSettings, { isLoading: isUpdating }] = useUpdateFinanceSettingsMutation();
  const [createCategory, { isLoading: isCreatingCat }] = useCreateCategoryMutation();
  const [lockPeriod, { isLoading: isLocking }] = useLockPeriodMutation();
  const [unlockPeriod, { isLoading: isUnlocking }] = useUnlockPeriodMutation();

  // Form states
  const [currency, setCurrency] = useState('BDT');
  const [currencySymbol, setCurrencySymbol] = useState('৳');
  const [defaultTaxRate, setDefaultTaxRate] = useState('0');
  const [taxNumber, setTaxNumber] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [billPrefix, setBillPrefix] = useState('BILL-');
  const [invoiceFooterNote, setInvoiceFooterNote] = useState('');
  const [invoiceTerms, setInvoiceTerms] = useState('');

  // Category creation form states
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catType, setCatType] = useState<FinanceCategoryType>('EXPENSE');
  const [catDesc, setCatDesc] = useState('');

  // Period Lock form states
  const [lockPeriodName, setLockPeriodName] = useState('');
  const [lockStartDate, setLockStartDate] = useState('');
  const [lockEndDate, setLockEndDate] = useState('');
  const [lockNotes, setLockNotes] = useState('');

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency || 'BDT');
      setCurrencySymbol(settings.currencySymbol || '৳');
      setDefaultTaxRate(settings.defaultTaxRate || '0');
      setTaxNumber(settings.taxNumber || '');
      setInvoicePrefix(settings.invoicePrefix || 'INV-');
      setBillPrefix(settings.billPrefix || 'BILL-');
      setInvoiceFooterNote(settings.invoiceFooterNote || '');
      setInvoiceTerms(settings.invoiceTerms || '');
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        currency,
        currencySymbol,
        defaultTaxRate,
        taxNumber: taxNumber || undefined,
        invoicePrefix,
        billPrefix,
        invoiceFooterNote: invoiceFooterNote || undefined,
        invoiceTerms: invoiceTerms || undefined,
      }).unwrap();

      toast.success('Finance settings saved successfully.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save settings.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catCode.trim()) {
      toast.error('Category name and code are required.');
      return;
    }

    try {
      await createCategory({
        name: catName.trim(),
        code: catCode.trim().toUpperCase().replace(/\s+/g, '_'),
        type: catType,
        description: catDesc.trim() || undefined,
      }).unwrap();

      toast.success('Category created.');
      setCatName('');
      setCatCode('');
      setCatDesc('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create category.');
    }
  };

  const handleLockPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockPeriodName.trim() || !lockStartDate || !lockEndDate) {
      toast.error('Period name, start date, and end date are required.');
      return;
    }

    try {
      await lockPeriod({
        periodName: lockPeriodName.trim(),
        startDate: lockStartDate,
        endDate: lockEndDate,
        notes: lockNotes.trim() || undefined,
      }).unwrap();

      toast.success(`Accounting period "${lockPeriodName}" locked successfully.`);
      setLockPeriodName('');
      setLockStartDate('');
      setLockEndDate('');
      setLockNotes('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to lock accounting period.');
    }
  };

  const handleUnlockPeriod = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to unlock period "${name}"? Transactions can now be posted retroactively.`)) {
      return;
    }

    try {
      await unlockPeriod(id).unwrap();
      toast.success(`Period "${name}" has been unlocked.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to unlock period.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finance Settings & Controls</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Currency preferences, prefixes, category rules, and accounting period locks
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            refetch();
            refetchCategories();
            refetchLocks();
          }}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ─── 1. GENERAL & INVOICE SETTINGS ───────────────────────────── */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-black text-slate-900">Currency & Invoicing Preferences</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Currency Code</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Default Tax / VAT %</label>
            <input
              type="number"
              step="0.1"
              value={defaultTaxRate}
              onChange={(e) => setDefaultTaxRate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tax / BIN Number</label>
            <input
              type="text"
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="e.g. 123456789"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number Prefix</label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bill Number Prefix</label>
            <input
              type="text"
              value={billPrefix}
              onChange={(e) => setBillPrefix(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Footer Note</label>
            <textarea
              value={invoiceFooterNote}
              onChange={(e) => setInvoiceFooterNote(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Default Terms & Conditions</label>
            <textarea
              value={invoiceTerms}
              onChange={(e) => setInvoiceTerms(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isUpdating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isUpdating ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* ─── 2. ACCOUNTING PERIOD CLOSING & LOCKS ─────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-black text-slate-900">Accounting Period Closing & Locks</h2>
              <p className="text-xs text-slate-500 font-medium">
                Lock completed months or fiscal years to prevent unauthorized historical edits
              </p>
            </div>
          </div>
        </div>

        {/* Lock Period Form */}
        <form onSubmit={handleLockPeriod} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
          <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider block">
            Lock a Closed Period
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Period Name</label>
              <input
                type="text"
                value={lockPeriodName}
                onChange={(e) => setLockPeriodName(e.target.value)}
                placeholder="e.g. August 2026 or FY-2025"
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={lockStartDate}
                onChange={(e) => setLockStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={lockEndDate}
                onChange={(e) => setLockEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={lockNotes}
              onChange={(e) => setLockNotes(e.target.value)}
              placeholder="Closing notes / auditor sign-off memo..."
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isLocking}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              {isLocking ? 'Locking...' : 'Lock Period'}
            </button>
          </div>
        </form>

        {/* List of Locked Periods */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-700">Period Lock History</span>
          {lockList.length === 0 ? (
            <p className="text-xs text-slate-400">No periods have been locked yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs">
              {lockList.map((lock) => (
                <div key={lock.id} className="p-3.5 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        lock.isLocked ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {lock.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{lock.periodName}</span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            lock.isLocked ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {lock.isLocked ? 'LOCKED' : 'UNLOCKED'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {lock.startDate} to {lock.endDate} {lock.lockedByName ? `• Locked by ${lock.lockedByName}` : ''}
                      </span>
                    </div>
                  </div>

                  {lock.isLocked && (
                    <button
                      type="button"
                      onClick={() => handleUnlockPeriod(lock.id, lock.periodName)}
                      disabled={isUnlocking}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold rounded-lg transition"
                    >
                      Unlock Period
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
