'use client';

import React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { FileSpreadsheet, CheckCircle2, Banknote, Trash2, ArrowUpRight, CheckCircle, Clock } from 'lucide-react';
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
  const { data, isLoading, refetch } = useGetPayrollRunQuery(runId ?? '', { skip: !runId });
  const [finalizeRun, { isLoading: isFinalizing }] = useFinalizePayrollRunMutation();
  const [markPaid, { isLoading: isMarkingPaid }] = useMarkPayrollRunPaidMutation();
  const [deleteRun, { isLoading: isDeleting }] = useDeletePayrollRunMutation();

  const run = data?.run;
  const payslips = data?.payslips ?? [];

  const handleApprovePayroll = async () => {
    if (!runId) return;
    try {
      await finalizeRun(runId).unwrap();
      toast.success('Payroll approved & synced to Finance module for salary payments!');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to approve payroll run.');
    }
  };

  const handleMarkPaid = async () => {
    if (!runId) return;
    try {
      await markPaid(runId).unwrap();
      toast.success('Payroll run marked as paid.');
      refetch();
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
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
          {run?.status === 'DRAFT' && (
            <>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 transition disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <button
                onClick={handleApprovePayroll}
                disabled={isFinalizing}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> {isFinalizing ? 'Approving & Syncing...' : 'Approve Payroll'}
              </button>
            </>
          )}
          {run?.status !== 'DRAFT' && (
            <Link
              href="/dashboard/finance/salaries"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <span>Disburse in Finance</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </>
      }
    >
      <div className="p-6 space-y-5">
        {isLoading || !run ? (
          <div className="text-center text-slate-400 py-10">Loading...</div>
        ) : (
          <>
            {run.status === 'DRAFT' && (
              <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-900 font-medium leading-relaxed">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-950">Finance Integration Ready:</span> Clicking{' '}
                  <span className="font-bold">&quot;Approve Payroll&quot;</span> will automatically record the accrued salary expense liability in Finance and enable cashier cash disbursements.
                </div>
              </div>
            )}

            {run.status !== 'DRAFT' && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 font-medium">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Approved &bull; Synchronized with Finance module for cash disbursement tracking.</span>
                </div>
                <Link
                  href="/dashboard/finance/salaries"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-emerald-800 font-bold hover:underline"
                >
                  <span>Open Finance Salaries</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            )}

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
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {payslips.map((slip: any) => {
                      const isPaid = slip.paymentStatus === 'PAID';
                      return (
                        <tr key={slip.id} className={isPaid ? 'bg-emerald-50/20' : ''}>
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
                          <td className="px-4 py-3 text-center">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Paid</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Unpaid</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
