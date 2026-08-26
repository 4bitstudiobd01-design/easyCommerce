'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Plus, RefreshCw, Eye } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { PayrollRunStatus, useGetPayrollRunsQuery } from '../api/hrmApi';
import { GeneratePayrollRunModal } from './GeneratePayrollRunModal';
import { PayrollRunDetailModal } from './PayrollRunDetailModal';

const STATUS_BADGE: Record<PayrollRunStatus, string> = {
  DRAFT: 'bg-amber-100 text-amber-800',
  FINALIZED: 'bg-sky-100 text-sky-800',
  PAID: 'bg-emerald-100 text-emerald-800',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatAmount(amount: string) {
  return `BDT ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PayrollRunsTable() {
  const { data: runs = [], isLoading, isFetching, refetch } = useGetPayrollRunsQuery();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [viewingRunId, setViewingRunId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Payroll Runs
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-full border border-blue-200">
                {runs.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Generate, finalize, and mark monthly payroll as paid</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Generate Run
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Gross</th>
                <th className="px-6 py-4">Net</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={5} />
                  <TableRowSkeleton columns={5} />
                </>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No payroll runs yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Click "Generate Run" to create one for a month.</p>
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/60 transition cursor-pointer" onClick={() => setViewingRunId(run.id)}>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {MONTHS[run.month - 1]} {run.year}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700">{formatAmount(run.totalGrossAmount)}</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700">{formatAmount(run.totalNetAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[run.status]}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingRunId(run.id);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GeneratePayrollRunModal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} />
      <PayrollRunDetailModal runId={viewingRunId} onClose={() => setViewingRunId(null)} />
    </div>
  );
}
