'use client';

import React from 'react';
import { PackagePlus, Layers, Download, FileDown, Loader2 } from 'lucide-react';

interface QuickActionsCardProps {
  onCreateShipment: () => void;
  onBulkShipment: () => void;
  onDownloadManifest: () => void;
  onExport: () => void;
  isExporting: boolean;
}

/**
 * Every action here does something real: the two shipment actions open the
 * create flow (single / bulk), and both download actions export the currently
 * filtered shipment set. No decorative buttons.
 */
export const QuickActionsCard = ({
  onCreateShipment,
  onBulkShipment,
  onDownloadManifest,
  onExport,
  isExporting,
}: QuickActionsCardProps) => {
  const buttonClass =
    'flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-[11px] font-bold rounded-xl transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
      <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={onCreateShipment} className={buttonClass}>
          <PackagePlus className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
          <span className="truncate">Create Shipment</span>
        </button>

        <button type="button" onClick={onBulkShipment} className={buttonClass}>
          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
          <span className="truncate">Bulk Shipment</span>
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className={buttonClass}
        >
          {isExporting ? (
            <Loader2
              className="w-3.5 h-3.5 text-blue-600 shrink-0 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">Export CSV</span>
        </button>

        <button
          type="button"
          onClick={onDownloadManifest}
          disabled={isExporting}
          className={buttonClass}
        >
          <FileDown className="w-3.5 h-3.5 text-violet-600 shrink-0" aria-hidden="true" />
          <span className="truncate">Download Manifest</span>
        </button>
      </div>
    </div>
  );
};
