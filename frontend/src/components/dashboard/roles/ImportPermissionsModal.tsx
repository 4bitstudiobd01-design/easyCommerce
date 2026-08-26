'use client';

import React, { useState } from 'react';
import { X, Upload, FileCode, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ImportPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (count: number) => void;
}

export function ImportPermissionsModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportPermissionsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateImport = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success('Successfully imported 8 custom permissions!');
      onImportComplete?.(8);
      onClose();
    }, 750);
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
              <h3 className="text-sm font-bold text-slate-900">Import Permissions</h3>
              <p className="text-[11px] text-slate-400">
                Upload JSON schema or CSV permissions dictionary.
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
          <div
            onClick={() => setSelectedFile('custom_rbac_permissions.json')}
            className={`p-6 border-2 border-dashed rounded-2xl text-center space-y-2 cursor-pointer transition-all ${
              selectedFile
                ? 'border-emerald-500 bg-emerald-50/30'
                : 'border-slate-300 hover:border-[#008060] bg-slate-50/50 hover:bg-emerald-50/10'
            }`}
          >
            {selectedFile ? (
              <>
                <FileCode className="w-8 h-8 mx-auto text-emerald-600" />
                <p className="font-bold text-slate-900">{selectedFile}</p>
                <p className="text-[11px] text-emerald-600 font-semibold">
                  8 permission entries detected
                </p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-slate-400" />
                <p className="font-bold text-slate-700">
                  Click to select JSON / CSV schema
                </p>
                <p className="text-[11px] text-slate-400">
                  Supports .JSON, .CSV formats
                </p>
              </>
            )}
          </div>

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
              className="px-5 py-2 bg-[#008060] hover:bg-[#006e52] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs shadow-[#008060]/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? 'Importing...' : 'Upload & Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
