'use client';

import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ExportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCount: number;
}

export function ExportTransactionsModal({
  isOpen,
  onClose,
  totalCount,
}: ExportTransactionsModalProps) {
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [range, setRange] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success(`Successfully exported ${totalCount} transactions as ${format.toUpperCase()}`);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Export Transactions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export {totalCount.toLocaleString()} financial records
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="space-y-2 text-xs">
          <label className="font-semibold text-slate-700 block">
            Select Export Format
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                format === 'csv'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('xlsx')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                format === 'xlsx'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                format === 'pdf'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <FileText className="w-5 h-5 text-rose-500" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2 text-xs">
          <label className="font-semibold text-slate-700 block">
            Date Scope
          </label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none cursor-pointer"
          >
            <option value="all">All Time (8,456 records)</option>
            <option value="current_month">This Month (1,240 records)</option>
            <option value="last_30_days">Last 30 Days (3,890 records)</option>
            <option value="filtered">Current Filter Selection</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Download'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
