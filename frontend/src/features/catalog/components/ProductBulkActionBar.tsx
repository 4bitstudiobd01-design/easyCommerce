'use client';

import React from 'react';
import { ProductStatus, useBulkUpdateProductStatusMutation } from '@/features/catalog/api/catalogApi';
import { Globe, FileEdit, Archive, Download, X, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductBulkActionBarProps {
  selectedProductIds: string[];
  onClearSelection: () => void;
  onExportSelected: () => void;
}

export function ProductBulkActionBar({
  selectedProductIds,
  onClearSelection,
  onExportSelected,
}: ProductBulkActionBarProps) {
  const [bulkUpdateStatus, { isLoading }] = useBulkUpdateProductStatusMutation();

  if (selectedProductIds.length === 0) return null;

  const handleBulkStatus = async (status: ProductStatus) => {
    try {
      const res = await bulkUpdateStatus({
        productIds: selectedProductIds,
        status,
      }).unwrap();

      if (res.failedCount === 0) {
        toast.success(`Successfully updated ${res.successCount} products to ${status}`);
        onClearSelection();
      } else {
        toast.warning(`Updated ${res.successCount} products, ${res.failedCount} failed validation`);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Bulk status update failed');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-3 px-5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
          {selectedProductIds.length}
        </span>
        <span className="text-xs font-bold text-slate-200">Products Selected</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleBulkStatus('ACTIVE')}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
          <span>Publish</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleBulkStatus('DRAFT')}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Move to Draft</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleBulkStatus('ARCHIVED')}
          className="px-3.5 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archive</span>
        </button>

        <button
          type="button"
          onClick={onExportSelected}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Selected</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white text-xs flex items-center gap-1 border-l border-slate-700 pl-3 ml-1"
        title="Clear Selection"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
