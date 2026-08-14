'use client';

import React, { useState, useRef } from 'react';
import {
  usePreviewCategoryImportMutation,
  useImportCategoriesMutation,
  CategoryImportPreviewResult,
} from '../api/catalogApi';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Download,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface CategoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryImportModal({ isOpen, onClose, onSuccess }: CategoryImportModalProps) {
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'CREATE_ONLY' | 'UPSERT'>('CREATE_ONLY');
  const [previewResult, setPreviewResult] = useState<CategoryImportPreviewResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewImport, { isLoading: isPreviewing }] = usePreviewCategoryImportMutation();
  const [executeImport, { isLoading: isImporting }] = useImportCategoriesMutation();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Please upload a valid .csv file');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      try {
        const preview = await previewImport({ csvContent: content }).unwrap();
        setPreviewResult(preview);
      } catch (err: any) {
        toast.error(err?.data?.message || 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const headers = 'Name,Slug,Description,ParentSlug,Status,SortOrder,IsVisible,ShowInStorefront,IsFeatured,SeoTitle,MetaDescription';
    const row1 = '"Fashion & Apparel","fashion-apparel","Clothing and style essentials","","ACTIVE","1","TRUE","TRUE","TRUE","Fashion & Apparel","Shop trending fashion."';
    const row2 = '"Men\'s Fashion","mens-fashion","Men\'s shirts, pants and shoes","fashion-apparel","ACTIVE","2","TRUE","TRUE","FALSE","Men\'s Fashion","Explore men\'s collection."';
    const row3 = '"Electronics","electronics","Smartphones, gadgets and computers","","ACTIVE","3","TRUE","TRUE","TRUE","Electronics","Find high quality electronics."';
    const csv = [headers, row1, row2, row3].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'category_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = async () => {
    if (!csvContent) {
      toast.error('No CSV content to import');
      return;
    }

    try {
      const result = await executeImport({
        csvContent,
        mode: importMode,
      }).unwrap();

      toast.success(
        `Import completed: ${result.createdCount} created, ${result.updatedCount} updated, ${result.failedCount} failed`,
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Import execution failed');
    }
  };

  const handleReset = () => {
    setCsvContent('');
    setFileName('');
    setPreviewResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Import Categories via CSV</h3>
              <p className="text-xs text-slate-500">Bulk upload or update categories with hierarchy validation.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Container */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Step 1: Upload Dropzone if no preview yet */}
          {!previewResult ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-500/60 bg-slate-50/60 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,text/csv"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
                  {isPreviewing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    {isPreviewing ? 'Analyzing and validating CSV...' : 'Click or drag a CSV file to upload'}
                  </p>
                  <p className="text-[11px] text-slate-400">Supported format: .csv (UTF-8 encoded, max 5MB)</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Need the standard CSV layout?</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Download Template CSV
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Validation Preview Table & Execution Options */
            <div className="space-y-4">
              {/* Summary Metric Chips */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Total Rows</span>
                  <span className="text-base font-bold text-slate-900">{previewResult.totalRows}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-0.5">
                  <span className="text-[11px] text-emerald-600 font-medium uppercase tracking-wider block">Valid Rows</span>
                  <span className="text-base font-bold text-emerald-700">{previewResult.validRows}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 space-y-0.5">
                  <span className="text-[11px] text-rose-600 font-medium uppercase tracking-wider block">Invalid Rows</span>
                  <span className="text-base font-bold text-rose-700">{previewResult.invalidRows}</span>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Duplicate Handling Strategy</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="CREATE_ONLY"
                      checked={importMode === 'CREATE_ONLY'}
                      onChange={() => setImportMode('CREATE_ONLY')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">Skip Existing Slugs</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="UPSERT"
                      checked={importMode === 'UPSERT'}
                      onChange={() => setImportMode('UPSERT')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">Update Existing Slugs</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Row</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Slug</th>
                        <th className="py-2.5 px-3">Parent</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewResult.previewData.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={`hover:bg-slate-50 transition-colors ${
                            !row.isValid ? 'bg-rose-50/50' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-500">#{row.rowIndex}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{row.name || '—'}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">/{row.slug}</td>
                          <td className="py-2.5 px-3 text-slate-600">{row.parentSlug || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-semibold">{row.status}</td>
                          <td className="py-2.5 px-3 text-right">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Valid
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                                title={row.errors.join(', ')}
                              >
                                <AlertCircle className="w-3 h-3" />
                                Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Error messages if any */}
              {previewResult.invalidRows > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-800">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Please resolve the following errors in your CSV:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px] text-rose-700">
                    {previewResult.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>
                        Row #{err.row} ({err.name}): {err.reason}
                      </li>
                    ))}
                    {previewResult.errors.length > 5 && (
                      <li className="font-semibold">
                        ...and {previewResult.errors.length - 5} more issues.
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 shrink-0">
          {previewResult ? (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Choose Another File</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>

            {previewResult && (
              <button
                type="button"
                disabled={previewResult.invalidRows > 0 || isImporting}
                onClick={handleExecuteImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  Confirm Import ({previewResult.validRows} {previewResult.validRows === 1 ? 'Category' : 'Categories'})
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
