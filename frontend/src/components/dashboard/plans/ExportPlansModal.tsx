'use client';

import React, { useState } from 'react';
import { X, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ExportPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPlansCount: number;
}

export function ExportPlansModal({
  isOpen,
  onClose,
  totalPlansCount,
}: ExportPlansModalProps) {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success(
        `Export complete! Downloaded plans data (${format.toUpperCase()}) with ${totalPlansCount} tiers.`
      );
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Export Plans</h3>
              <p className="text-xs text-slate-500">
                Export tier pricing, feature limits, and subscriber metrics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  format === 'csv'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileText
                  className={`w-5 h-5 ${
                    format === 'csv' ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">CSV</span>
                  <span className="text-[11px] text-slate-400">Raw plan metrics</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  format === 'xlsx'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet
                  className={`w-5 h-5 ${
                    format === 'xlsx' ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Excel (.xlsx)</span>
                  <span className="text-[11px] text-slate-400">Formatted workbook</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>{isExporting ? 'Generating...' : 'Download Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
