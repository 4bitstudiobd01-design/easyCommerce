'use client';

import React, { useState } from 'react';
import {
  Banknote,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Scale,
  CreditCard,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Lock,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import {
  SalaryPaymentRun,
  useGetSalaryPaymentRunsQuery,
  useGetSalaryPaymentSummaryQuery,
} from '../api/financeApi';
import { SalaryPaymentMonthDetail } from './SalaryPaymentMonthDetail';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function SalaryPaymentsView() {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = All Months
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const { data: summary, isLoading: summaryLoading } = useGetSalaryPaymentSummaryQuery({
    year: selectedYear,
    month: selectedMonth === 0 ? undefined : selectedMonth,
  });

  const { data: runsData, isLoading: runsLoading } = useGetSalaryPaymentRunsQuery({
    year: selectedYear,
    month: selectedMonth === 0 ? undefined : selectedMonth,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
  });

  const runs: SalaryPaymentRun[] = Array.isArray(runsData)
    ? runsData
    : Array.isArray((runsData as any)?.data)
    ? (runsData as any).data
    : Array.isArray((runsData as any)?.items)
    ? (runsData as any).items
    : [];

  if (selectedRunId) {
    return <SalaryPaymentMonthDetail runId={selectedRunId} onBack={() => setSelectedRunId(null)} />;
  }

  const now = new Date();
  const currentCalMonth = now.getMonth() + 1;
  const currentCalYear = now.getFullYear();

  const totalExpense = summary?.totalPayrollExpense || 0;
  const totalPayable = summary?.totalSalaryPayable || 0;
  const totalPaid = summary?.totalSalaryPaid || 0;
  const totalRemaining = summary?.totalSalaryRemaining || 0;
  const employeesPaid = summary?.totalEmployeesPaid || 0;
  const employeesUnpaid = summary?.totalEmployeesUnpaid || 0;
  const totalApprovedRuns = summary?.totalApprovedRuns || 0;

  const currentMonthLabel = selectedMonth > 0 ? MONTH_NAMES[selectedMonth - 1] : 'All Months';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Banknote className="w-4 h-4" />
            </div>
            <span>Salary Payments & Disbursements</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage approved monthly payroll batches, record cash payouts to staff, and reconcile salary liabilities.
          </p>
        </div>

        {/* Filters: Month & Year */}
        <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-1.5 rounded-2xl shadow-xs">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 pl-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={0}>All Months</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Year Selector */}
          <div className="flex items-center gap-1.5 pr-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security & Previous Month Policy Notice */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-100 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Accounting Protection & Prior Month Integrity</span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                Admin Only
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Current active period is <strong className="text-slate-800">{MONTH_NAMES[currentCalMonth - 1]} {currentCalYear}</strong>. Previous months&apos; salary disbursements and modifications are locked for regular staff and require Administrator credentials.
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-blue-200/60 shrink-0">
          <Lock className="w-3 h-3 text-blue-600" />
          <span>Audit-Safe Ledger</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payroll Expense */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Payroll Expense
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {summaryLoading ? '—' : `৳${totalExpense.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {selectedMonth > 0
              ? `${currentMonthLabel} ${selectedYear}`
              : `Across ${totalApprovedRuns} approved batch(es)`}
          </div>
        </div>

        {/* Total Salary Payable (Net) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Net Payable
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {summaryLoading ? '—' : `৳${totalPayable.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            Net compensation liability owed
          </div>
        </div>

        {/* Total Salary Paid */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Total Disbursed (Paid)
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mb-1">
            {summaryLoading ? '—' : `৳${totalPaid.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            {employeesPaid} staff members paid in cash
          </div>
        </div>

        {/* Remaining Unpaid Balance */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Remaining Unpaid
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mb-1">
            {summaryLoading ? '—' : `৳${totalRemaining.toLocaleString()}`}
          </div>
          <div className="text-[11px] text-rose-700 font-medium">
            {employeesUnpaid} staff members awaiting payment
          </div>
        </div>
      </div>

      {/* Filter and Status Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Payment Status:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {[
              { key: 'ALL', label: 'All Runs' },
              { key: 'UNPAID', label: 'Unpaid' },
              { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
              { key: 'PAID', label: 'Paid in Full' },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setSelectedStatus(st.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedStatus === st.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{runs.length}</span> approved payroll month(s)
          {selectedMonth > 0 && <span> for <strong className="text-blue-600">{currentMonthLabel} {selectedYear}</strong></span>}
        </div>
      </div>

      {/* Month Batches Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-4">Payroll Month</th>
                <th className="px-4 py-4 text-center">Period Status</th>
                <th className="px-4 py-4 text-center">Employees Paid</th>
                <th className="px-4 py-4 text-right">Gross Salary</th>
                <th className="px-4 py-4 text-right">Deductions</th>
                <th className="px-4 py-4 text-right">Net Payable</th>
                <th className="px-4 py-4 text-right">Total Paid</th>
                <th className="px-4 py-4 text-right">Remaining</th>
                <th className="px-4 py-4 text-center">Payment Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runsLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    Loading salary payment batches...
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <Banknote className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">No Approved Payroll Batches Found</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        When a monthly payroll run is approved in the HR Payroll module, it is automatically synchronized here in Finance for employee cash disbursements and ledger tracking.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                runs.map((run: SalaryPaymentRun) => {
                  const monthName = MONTH_NAMES[run.month - 1] || `Month ${run.month}`;
                  const isFullyPaid = run.paymentStatus === 'PAID';
                  const isPartiallyPaid = run.paymentStatus === 'PARTIALLY_PAID';
                  const isCurrentMonth = run.year === currentCalYear && run.month === currentCalMonth;
                  const isPastMonth =
                    run.year < currentCalYear || (run.year === currentCalYear && run.month < currentCalMonth);

                  return (
                    <tr
                      key={run.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedRunId(run.id)}
                    >
                      {/* Month & Period */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl font-black flex items-center justify-center text-xs ${
                            isCurrentMonth
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {run.month}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight text-sm">
                              {monthName} {run.year}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Approved &bull; {new Date(run.finalizedAt || run.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Period Status Badge */}
                      <td className="px-4 py-4 text-center">
                        {isCurrentMonth ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Current Month</span>
                          </span>
                        ) : isPastMonth ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200" title="Previous Month (Admin Only)">
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Past Month</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <span>Upcoming</span>
                          </span>
                        )}
                      </td>

                      {/* Employees Count */}
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-slate-900 text-xs">
                          {run.paidEmployeesCount} / {run.totalEmployees}
                        </span>
                        <div className="w-20 mx-auto h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${run.totalEmployees > 0 ? (run.paidEmployeesCount / run.totalEmployees) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Gross */}
                      <td className="px-4 py-4 text-right font-medium text-slate-700">
                        ৳{Number(run.totalGrossAmount).toLocaleString()}
                      </td>

                      {/* Deductions */}
                      <td className="px-4 py-4 text-right font-medium text-rose-600">
                        -৳{Number(run.totalDeductions).toLocaleString()}
                      </td>

                      {/* Net Payable */}
                      <td className="px-4 py-4 text-right font-bold text-slate-900">
                        ৳{Number(run.totalNetAmount).toLocaleString()}
                      </td>

                      {/* Paid */}
                      <td className="px-4 py-4 text-right font-bold text-emerald-700">
                        ৳{Number(run.totalPaidAmount).toLocaleString()}
                      </td>

                      {/* Remaining */}
                      <td className="px-4 py-4 text-right font-black text-rose-600">
                        ৳{Number(run.remainingAmount).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        {isFullyPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Paid in Full</span>
                          </span>
                        ) : isPartiallyPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>Partially Paid</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Unpaid</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRunId(run.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer group-hover:bg-blue-600 group-hover:text-white"
                        >
                          <span>Disburse / View</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
