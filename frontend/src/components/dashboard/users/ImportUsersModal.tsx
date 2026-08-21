'use client';

import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImportUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (count: number) => void;
}

export function ImportUsersModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportUsersModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateImport = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success('Successfully imported 6 admin users from CSV!');
      onImportComplete?.(6);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Import Admin Users</h3>
              <p className="text-[11px] text-slate-400">
                Bulk upload via CSV or XLSX spreadsheet.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Dropzone */}
          <div
            onClick={() => setSelectedFile('admin_users_batch_2026.csv')}
            className={`p-6 border-2 border-dashed rounded-2xl text-center space-y-2 cursor-pointer transition-all ${
              selectedFile
                ? 'border-emerald-500 bg-emerald-50/30'
                : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/10'
            }`}
          >
            {selectedFile ? (
              <>
                <FileSpreadsheet className="w-8 h-8 mx-auto text-emerald-600" />
                <p className="font-bold text-slate-900">{selectedFile}</p>
                <p className="text-[11px] text-emerald-600 font-semibold">
                  6 rows ready to import
                </p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-slate-400" />
                <p className="font-bold text-slate-700">
                  Click to browse or drag and drop file here
                </p>
                <p className="text-[11px] text-slate-400">
                  Supports .CSV, .XLSX (Max file size: 5MB)
                </p>
              </>
            )}
          </div>

          {/* Download Sample Template */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-600 font-medium">Download CSV Template</span>
            </div>
            <button
              type="button"
              onClick={() => toast.info('Downloaded admin_users_template.csv')}
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={handleSimulateImport}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? 'Importing...' : 'Upload and Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
