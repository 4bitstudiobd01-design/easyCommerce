'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { useImportCustomersMutation, ImportCustomerRow, CustomerStatusType, CustomerSourceType } from '../api/customerApi';
import { toast } from 'sonner';

interface ImportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ParsedRowResult {
  rowNumber: number;
  data: ImportCustomerRow;
  status: 'VALID' | 'INVALID' | 'DUPLICATE';
  errors: string[];
}

export function ImportCustomersModal({ isOpen, onClose }: ImportCustomersModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; failed: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importCustomers, { isLoading: isImporting }] = useImportCustomersMutation();

  if (!isOpen) return null;

  // Robust CSV Line Parser safely handling quotes, escaped quotes, commas inside quotes, UTF-8 & CRLF
  const parseCsvText = (text: string): string[][] => {
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    // Normalize newlines
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      const nextChar = normalized[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' && !inQuotes) {
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field !== '')) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField !== '' || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field !== '')) {
        lines.push(currentRow);
      }
    }

    return lines;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processSelectedFile(selectedFile);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Invalid file type. Please upload a .csv file.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        toast.error('Uploaded file is empty.');
        return;
      }

      // Remove UTF-8 BOM if present
      const cleanContent = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
      const rows = parseCsvText(cleanContent);

      if (rows.length < 2) {
        toast.error('CSV file must contain a header row and at least one customer row.');
        return;
      }

      const headers = rows[0].map((h) => h.trim().toLowerCase());

      // Auto-map headers
      const firstNameIdx = headers.findIndex((h) => h.includes('firstname') || h === 'first name' || h === 'name');
      const lastNameIdx = headers.findIndex((h) => h.includes('lastname') || h === 'last name');
      const emailIdx = headers.findIndex((h) => h.includes('email'));
      const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));
      const sourceIdx = headers.findIndex((h) => h.includes('source'));
      const statusIdx = headers.findIndex((h) => h.includes('status'));

      if (firstNameIdx === -1 && phoneIdx === -1) {
        toast.error('Missing required columns: firstName and phone columns could not be identified.');
        return;
      }

      const batchPhones = new Set<string>();
      const batchEmails = new Set<string>();
      const parsedResults: ParsedRowResult[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || row.every((val) => val === '')) continue;

        const rawFirstName = firstNameIdx !== -1 ? row[firstNameIdx] || '' : '';
        const rawLastName = lastNameIdx !== -1 ? row[lastNameIdx] || '' : '';
        const rawEmail = emailIdx !== -1 ? row[emailIdx] || '' : '';
        const rawPhone = phoneIdx !== -1 ? row[phoneIdx] || '' : '';
        const rawSource = sourceIdx !== -1 ? row[sourceIdx] || '' : '';
        const rawStatus = statusIdx !== -1 ? row[statusIdx] || '' : '';

        const errors: string[] = [];

        if (!rawFirstName) errors.push('Missing First Name');
        if (!rawPhone) errors.push('Missing Phone Number');

        const cleanEmail = rawEmail.toLowerCase();
        if (cleanEmail && !cleanEmail.includes('@')) {
          errors.push('Invalid Email format');
        }

        let isDuplicate = false;
        if (rawPhone && batchPhones.has(rawPhone)) {
          isDuplicate = true;
          errors.push('Duplicate phone in file');
        }
        if (cleanEmail && batchEmails.has(cleanEmail)) {
          isDuplicate = true;
          errors.push('Duplicate email in file');
        }

        if (rawPhone) batchPhones.add(rawPhone);
        if (cleanEmail) batchEmails.add(cleanEmail);

        let rowStatus: 'VALID' | 'INVALID' | 'DUPLICATE' = 'VALID';
        if (errors.length > 0) {
          rowStatus = isDuplicate ? 'DUPLICATE' : 'INVALID';
        }

        // Validate source enum
        let sourceVal: CustomerSourceType = 'IMPORT';
        if (['ONLINE_STORE', 'MANUAL', 'POS', 'IMPORT'].includes(rawSource.toUpperCase())) {
          sourceVal = rawSource.toUpperCase() as CustomerSourceType;
        }

        // Validate status enum
        let statusVal: CustomerStatusType = 'ACTIVE';
        if (['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(rawStatus.toUpperCase())) {
          statusVal = rawStatus.toUpperCase() as CustomerStatusType;
        }

        parsedResults.push({
          rowNumber: i,
          data: {
            firstName: rawFirstName || 'Unknown',
            lastName: rawLastName || '',
            email: cleanEmail || undefined,
            phone: rawPhone,
            source: sourceVal,
            status: statusVal,
          },
          status: rowStatus,
          errors,
        });
      }

      setParsedRows(parsedResults);
      setStep(2);
    };

    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleDownloadSampleTemplate = () => {
    const sampleCsv = `firstName,lastName,email,phone,source,status
Karim,Uddin,karim@example.com,01711999888,IMPORT,ACTIVE
Nusrat,Jahan,nusrat@example.com,01812777666,MANUAL,ACTIVE
Tariq,Rahman,,01913555444,POS,ACTIVE`;

    const blob = new Blob(['\uFEFF' + sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bitcommerce-customer-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV template downloaded');
  };

  const validRows = parsedRows.filter((r) => r.status === 'VALID' || r.status === 'DUPLICATE');
  const validCount = parsedRows.filter((r) => r.status === 'VALID').length;
  const invalidCount = parsedRows.filter((r) => r.status === 'INVALID').length;
  const duplicateCount = parsedRows.filter((r) => r.status === 'DUPLICATE').length;

  const handleExecuteImport = async () => {
    const payloadRows = parsedRows
      .filter((r) => r.status === 'VALID' || (r.status === 'DUPLICATE' && overwrite))
      .map((r) => r.data);

    if (payloadRows.length === 0) {
      toast.error('No valid rows available to import.');
      return;
    }

    try {
      const res = await importCustomers({ customers: payloadRows, overwrite }).unwrap();
      setImportResult(res);
      setStep(3);
      toast.success(`Import complete! ${res.created} created, ${res.skipped} skipped.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to process customer import.');
    }
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Import Customers</h2>
              <p className="text-xs text-slate-500">Upload customer CSV file to bulk import profiles</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: UPLOAD FILE */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Drag & Drop Upload Container */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3 group"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">Click or Drag CSV File Here</p>
                  <p className="text-xs text-slate-500 mt-1">Supports UTF-8 encoded .csv files up to 5MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Sample Template Section */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-extrabold text-slate-800 text-xs">Need a formatted CSV template?</p>
                    <p className="text-[11px] text-slate-500">Includes correct headers: firstName, lastName, email, phone, source, status</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample CSV
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION */}
          {step === 2 && (
            <div className="space-y-5 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Rows</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{parsedRows.length}</p>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200">
                  <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Valid</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">{validCount}</p>
                </div>

                <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200">
                  <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Duplicates</p>
                  <p className="text-lg font-black text-amber-700 mt-0.5">{duplicateCount}</p>
                </div>

                <div className="bg-rose-50 rounded-2xl p-3 border border-rose-200">
                  <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Invalid</p>
                  <p className="text-lg font-black text-rose-700 mt-0.5">{invalidCount}</p>
                </div>
              </div>

              {/* Overwrite Option Checkbox */}
              <div className="bg-blue-50/60 rounded-2xl p-3.5 border border-blue-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    id="overwrite-checkbox"
                    type="checkbox"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="overwrite-checkbox" className="font-bold text-slate-800 text-xs cursor-pointer">
                    Overwrite existing customer profiles if phone/email matches
                  </label>
                </div>
                <span className="text-[11px] text-slate-500">Default: Skip existing</span>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 pl-3">Row</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 pr-3 text-right">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {parsedRows.slice(0, 50).map((r) => (
                      <tr key={r.rowNumber} className="hover:bg-slate-50">
                        <td className="p-2.5 pl-3 font-bold text-slate-400">#{r.rowNumber}</td>
                        <td className="p-2.5 font-bold text-slate-900">{r.data.firstName} {r.data.lastName}</td>
                        <td className="p-2.5">{r.data.phone}</td>
                        <td className="p-2.5 text-slate-500">{r.data.email || '—'}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {r.data.status}
                          </span>
                        </td>
                        <td className="p-2.5 pr-3 text-right">
                          {r.status === 'VALID' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          ) : r.status === 'DUPLICATE' ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]" title={r.errors.join(', ')}>
                              <AlertTriangle className="w-3.5 h-3.5" /> Duplicate
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]" title={r.errors.join(', ')}>
                              <AlertCircle className="w-3.5 h-3.5" /> {r.errors[0] || 'Invalid'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: RESULT SUMMARY */}
          {step === 3 && importResult && (
            <div className="space-y-6 text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Import Completed Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1">Customer list and store KPI cards have been updated.</p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-xs">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <p className="font-extrabold text-emerald-700 uppercase tracking-wider text-[10px]">Created</p>
                  <p className="text-2xl font-black text-emerald-800 mt-1">{importResult.created}</p>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                  <p className="font-extrabold text-amber-700 uppercase tracking-wider text-[10px]">Skipped</p>
                  <p className="text-2xl font-black text-amber-800 mt-1">{importResult.skipped}</p>
                </div>

                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200">
                  <p className="font-extrabold text-rose-700 uppercase tracking-wider text-[10px]">Failed</p>
                  <p className="text-2xl font-black text-rose-800 mt-1">{importResult.failed}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          {step === 2 ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Upload Different File
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || validCount === 0}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Import...
                  </>
                ) : (
                  <>
                    Confirm & Import ({validCount} Customers)
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : step === 3 ? (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
