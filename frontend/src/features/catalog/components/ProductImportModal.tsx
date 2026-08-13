'use client';

import React, { useState } from 'react';
import { ImportMode, ImportProductsResult, useImportProductsMutation } from '@/features/catalog/api/catalogApi';
import { Upload, Download, FileSpreadsheet, X, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductImportModal({ isOpen, onClose }: ProductImportModalProps) {
  const [importProducts, { isLoading }] = useImportProductsMutation();

  const [mode, setMode] = useState<ImportMode>('UPSERT');
  const [csvText, setCsvText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [importResult, setImportResult] = useState<ImportProductsResult | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content || '');
      setImportResult(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDownloadTemplate = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/catalog';
    window.open(`${apiUrl}/products/import/template`, '_blank');
  };

  const handleExecuteImport = async () => {
    if (!csvText.trim()) {
      toast.error('Please select or paste a CSV file to import.');
      return;
    }

    try {
      const res = await importProducts({ csvContent: csvText, mode }).unwrap();
      setImportResult(res);

      if (res.failedCount === 0) {
        toast.success(`Import successful! Created ${res.createdCount}, Updated ${res.updatedCount}.`);
      } else {
        toast.warning(`Import finished: ${res.createdCount} created, ${res.updatedCount} updated, ${res.failedCount} failed.`);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Product import failed.');
    }
  };

  const handleDownloadErrorReport = () => {
    if (!importResult || importResult.failures.length === 0) return;

    const headers = ['Row', 'Product Name', 'SKU', 'Failure Reason'];
    const rows = importResult.failures.map((f) => [
      f.row,
      `"${(f.name || '').replace(/"/g, '""')}"`,
      `"${(f.sku || '').replace(/"/g, '""')}"`,
      `"${(f.reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product_import_errors.csv';
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span>Import Products from CSV</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload bulk product catalog CSV with headers (Name, SKU, Price, Status, Category)
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Import Mode:</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ImportMode)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            >
              <option value="UPSERT">Create or Update (Recommended)</option>
              <option value="CREATE">Create New Products Only</option>
              <option value="UPDATE">Update Existing Products Only</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-3.5 py-1.5 text-blue-600 font-bold text-xs hover:bg-blue-50 rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Upload Zone */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Select CSV File
          </label>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              {fileName ? `Loaded file: ${fileName}` : 'Click to browse or drag & drop .csv file'}
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="mt-3 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
        </div>

        {/* Import Results Summary */}
        {importResult && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Import Processed ({importResult.totalRows} rows)
              </span>

              {importResult.failedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadErrorReport}
                  className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download Error Report ({importResult.failedCount})
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Created</span>
                <span className="font-extrabold text-emerald-600">{importResult.createdCount}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Updated</span>
                <span className="font-extrabold text-blue-600">{importResult.updatedCount}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Failed</span>
                <span className="font-extrabold text-rose-600">{importResult.failedCount}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Total</span>
                <span className="font-extrabold text-slate-900">{importResult.totalRows}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
          >
            Close
          </button>

          <button
            type="button"
            disabled={isLoading || !csvText}
            onClick={handleExecuteImport}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Execute Import</span>
          </button>
        </div>
      </div>
    </div>
  );
}
