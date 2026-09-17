'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Landmark, Plus, Trash2, RefreshCw, Calculator, ShieldAlert } from 'lucide-react';
import { TaxSlabInput, useGetTaxSlabsQuery, useSetTaxSlabsMutation, useLazyEstimateTaxQuery } from '../api/hrmApi';

function currentFiscalYear() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const startYear = month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}

function formatAmount(amount: number) {
  return `BDT ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TaxSlabsTable() {
  const [fiscalYear, setFiscalYear] = useState(currentFiscalYear());
  const [rows, setRows] = useState<TaxSlabInput[]>([]);
  const [estimateIncome, setEstimateIncome] = useState('');

  const { data: slabs = [], isFetching, refetch } = useGetTaxSlabsQuery({ fiscalYear });
  const [setTaxSlabs, { isLoading: isSaving }] = useSetTaxSlabsMutation();
  const [triggerEstimate, { data: estimate, isFetching: isEstimating }] = useLazyEstimateTaxQuery();

  useEffect(() => {
    setRows(
      slabs.length > 0
        ? slabs.map((s) => ({ minAmount: s.minAmount, maxAmount: s.maxAmount, ratePercent: Number(s.ratePercent) }))
        : [{ minAmount: '0', maxAmount: undefined, ratePercent: 0 }],
    );
  }, [slabs]);

  const updateRow = (index: number, patch: Partial<TaxSlabInput>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    const last = rows[rows.length - 1];
    setRows((prev) => [...prev, { minAmount: last?.maxAmount ?? '0', maxAmount: undefined, ratePercent: 0 }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await setTaxSlabs({ fiscalYear, slabs: rows }).unwrap();
      toast.success('Tax slabs saved.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save tax slabs.');
    }
  };

  const handleEstimate = () => {
    if (!estimateIncome) {
      toast.error('Enter an annual income to estimate.');
      return;
    }
    triggerEstimate({ fiscalYear, annualIncome: estimateIncome });
  };

  const fieldClass =
    'w-full px-3 h-9 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-slate-700 to-slate-900 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-slate-500/20">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tax Slabs</h2>
            <p className="text-xs text-slate-500 mt-0.5">Progressive income-tax brackets used when generating payroll</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            placeholder="2025-2026"
            className="h-10 px-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-600 w-32"
          />
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          No slabs are pre-filled — Bangladesh's NBR tax brackets and rates change with each Finance Act. Enter your
          store's current figures and confirm them with your accountant before relying on this for payroll.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Min (BDT)</label>
                <input type="number" min="0" step="0.01" value={row.minAmount} onChange={(e) => updateRow(index, { minAmount: e.target.value })} className={fieldClass} />
              </div>
              <div className="col-span-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Max (BDT) {index === rows.length - 1 && <span className="text-slate-400 normal-case font-normal">— blank = no limit</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.maxAmount ?? ''}
                  onChange={(e) => updateRow(index, { maxAmount: e.target.value || undefined })}
                  className={fieldClass}
                  placeholder={index === rows.length - 1 ? 'No limit' : ''}
                />
              </div>
              <div className="col-span-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Rate %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={row.ratePercent}
                  onChange={(e) => updateRow(index, { ratePercent: Number(e.target.value) })}
                  className={fieldClass}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => removeRow(index)}
                  disabled={rows.length <= 1}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove slab"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Slab
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Tax Slabs'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-4 h-4" /> Estimate
        </h3>
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Annual Income (BDT)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={estimateIncome}
              onChange={(e) => setEstimateIncome(e.target.value)}
              className={fieldClass}
              placeholder="600000"
            />
          </div>
          <button
            onClick={handleEstimate}
            disabled={isEstimating}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50"
          >
            {isEstimating ? 'Calculating...' : 'Calculate'}
          </button>
        </div>

        {estimate && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Annual Tax</div>
                <div className="text-lg font-extrabold text-slate-900 font-mono">{formatAmount(estimate.annualTax)}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Tax</div>
                <div className="text-lg font-extrabold text-rose-600 font-mono">{formatAmount(estimate.monthlyTax)}</div>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="px-3 py-2">Slab</th>
                    <th className="px-3 py-2">Rate</th>
                    <th className="px-3 py-2">Taxable</th>
                    <th className="px-3 py-2">Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {estimate.breakdown.map((b, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono text-slate-600">
                        {formatAmount(b.minAmount)} – {b.maxAmount !== null ? formatAmount(b.maxAmount) : 'No limit'}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-700">{b.ratePercent}%</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{formatAmount(b.taxableInSlab)}</td>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">{formatAmount(b.taxInSlab)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
