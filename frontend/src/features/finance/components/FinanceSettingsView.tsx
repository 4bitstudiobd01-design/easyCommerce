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
} from 'lucide-react';
import {
  useGetFinanceSettingsQuery,
  useUpdateFinanceSettingsMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  FinanceCategory,
  FinanceCategoryType,
} from '../api/financeApi';

export function FinanceSettingsView() {
  const { data: settings, isLoading, isFetching, refetch } = useGetFinanceSettingsQuery();
  const { data: categories, refetch: refetchCategories } = useGetCategoriesQuery();

  const categoryList: FinanceCategory[] = Array.isArray(categories) ? categories : [];

  const [updateSettings, { isLoading: isUpdating }] = useUpdateFinanceSettingsMutation();
  const [createCategory, { isLoading: isCreatingCat }] = useCreateCategoryMutation();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finance Settings</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure currency, default tax rates, invoice templates, and custom ledger categories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              refetch();
              refetchCategories();
            }}
            disabled={isFetching}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form (2 cols) */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSaveSettings}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6"
          >
            {/* Currency & Tax */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Currency & Tax Configuration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Base Currency
                  </label>
                  <input
                    type="text"
                    required
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="BDT"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    required
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    placeholder="৳"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Default Tax / VAT Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={defaultTaxRate}
                    onChange={(e) => setDefaultTaxRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Business Tax Identification / BIN
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="e.g. BIN-001928374"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Invoicing & Billing Prefixes */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileText className="w-4 h-4 text-blue-600" />
                Invoicing & Document Prefixes
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Invoice Number Prefix
                  </label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="INV-"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Bill Number Prefix
                  </label>
                  <input
                    type="text"
                    value={billPrefix}
                    onChange={(e) => setBillPrefix(e.target.value)}
                    placeholder="BILL-"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Default Invoice Terms & Conditions
                  </label>
                  <textarea
                    rows={2}
                    value={invoiceTerms}
                    onChange={(e) => setInvoiceTerms(e.target.value)}
                    placeholder="e.g. Payment due within 14 days of issue date..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Invoice Footer Note
                  </label>
                  <input
                    type="text"
                    value={invoiceFooterNote}
                    onChange={(e) => setInvoiceFooterNote(e.target.value)}
                    placeholder="e.g. Thank you for your business!"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <Save className="w-4 h-4" />
                {isUpdating ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Category Management Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Add Category Card */}
          <form
            onSubmit={handleCreateCategory}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Tag className="w-4 h-4 text-emerald-600" />
              Add Custom Category
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Logistics Payout"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Category Code *
              </label>
              <input
                type="text"
                required
                value={catCode}
                onChange={(e) => setCatCode(e.target.value)}
                placeholder="LOGISTICS_PAYOUT"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Type *
              </label>
              <select
                value={catType}
                onChange={(e) => setCatType(e.target.value as FinanceCategoryType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
              >
                <option value="EXPENSE">Expense Category</option>
                <option value="INCOME">Income Category</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Description
              </label>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingCat}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              {isCreatingCat ? 'Adding...' : 'Add Category'}
            </button>
          </form>

          {/* Active Categories List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Active Categories ({categoryList.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {categoryList.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">{c.code}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.type === 'INCOME'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {c.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
