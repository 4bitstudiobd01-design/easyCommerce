'use client';

import React from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { FileSpreadsheet, CheckCircle2, Banknote, Trash2 } from 'lucide-react';
import {
  useGetPayrollRunQuery,
  useFinalizePayrollRunMutation,
  useMarkPayrollRunPaidMutation,
  useDeletePayrollRunMutation,
} from '../api/hrmApi';

interface PayrollRunDetailModalProps {
  runId: string | null;
  onClose: () => void;
}

function formatAmount(amount: string) {
  return `BDT ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function PayrollRunDetailModal({ runId, onClose }: PayrollRunDetailModalProps) {
  const { data, isLoading } = useGetPayrollRunQuery(runId ?? '', { skip: !runId });
  const [finalizeRun, { isLoading: isFinalizing }] = useFinalizePayrollRunMutation();
  const [markPaid, { isLoading: isMarkingPaid }] = useMarkPayrollRunPaidMutation();
  const [deleteRun, { isLoading: isDeleting }] = useDeletePayrollRunMutation();

  const run = data?.run;
  const payslips = data?.payslips ?? [];

  const handleFinalize = async () => {
    if (!runId) return;
    try {
      await finalizeRun(runId).unwrap();
      toast.success('Payroll run finalized.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to finalize payroll run.');
    }
  };

  const handleMarkPaid = async () => {
    if (!runId) return;
    try {
      await markPaid(runId).unwrap();
      toast.success('Payroll run marked as paid.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to mark payroll run as paid.');
    }
  };

  const handleDelete = async () => {
    if (!runId) return;
    try {
      await deleteRun(runId).unwrap();
      toast.success('Payroll run deleted.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete payroll run.');
    }
  };

  return (
    <Modal
      isOpen={!!runId}
      onClose={onClose}
      title={run ? `Payroll — ${MONTHS[run.month - 1]} ${run.year}` : 'Payroll Run'}
      icon={<FileSpreadsheet className="w-5 h-5" />}
      size="xl"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          {run?.status === 'DRAFT' && (
            <>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <button
                onClick={handleFinalize}
                disabled={isFinalizing}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {isFinalizing ? 'Finalizing...' : 'Finalize'}
              </button>
            </>
          )}
          {run?.status === 'FINALIZED' && (
            <button
              onClick={handleMarkPaid}
              disabled={isMarkingPaid}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <Banknote className="w-3.5 h-3.5" /> {isMarkingPaid ? 'Marking...' : 'Mark as Paid'}
            </button>
          )}
        </>
      }
    >
      <div className="p-6 space-y-5">
        {isLoading || !run ? (
          <div className="text-center text-slate-400 py-10">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross</div>
                <div className="text-lg font-extrabold text-slate-900 font-mono">{formatAmount(run.totalGrossAmount)}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Deductions</div>
                <div className="text-lg font-extrabold text-rose-600 font-mono">{formatAmount(run.totalDeductions)}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net</div>
                <div className="text-lg font-extrabold text-emerald-700 font-mono">{formatAmount(run.totalNetAmount)}</div>
              </div>
            </div>

            {run.skippedEmployeeCount > 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                {run.skippedEmployeeCount} active employee(s) had no salary structure set and were skipped from this run.
              </div>
            )}

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0">
                    <tr className="bg-slate-50/95 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Basic</th>
                      <th className="px-4 py-3">Gross</th>
                      <th className="px-4 py-3">Deductions</th>
                      <th className="px-4 py-3">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {payslips.map((slip) => (
                      <tr key={slip.id}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{slip.employee?.fullName ?? 'Unknown'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{slip.employee?.employeeCode}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{formatAmount(slip.basicSalary)}</td>
                        <td className="px-4 py-3 font-mono text-slate-800 font-bold">{formatAmount(slip.grossSalary)}</td>
                        <td className="px-4 py-3 font-mono text-rose-600">
                          {formatAmount((Number(slip.providentFundDeduction) + Number(slip.taxDeduction) + Number(slip.otherDeductions)).toFixed(2))}
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-700 font-bold">{formatAmount(slip.netSalary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
