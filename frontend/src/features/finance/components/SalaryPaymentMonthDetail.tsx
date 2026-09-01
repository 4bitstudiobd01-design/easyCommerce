'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  ArrowLeft,
  Banknote,
  Search,
  CheckCircle2,
  Clock,
  Filter,
  UserCheck,
  Building,
  User,
  CreditCard,
  FileCheck,
  AlertCircle,
  Receipt,
  Download,
  Check,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  SalaryPaymentEmployee,
  useDisburseSalaryPaymentBulkMutation,
  useGetSalaryPaymentRunDetailQuery,
} from '../api/financeApi';
import { ConfirmCashSalaryPaymentModal } from './ConfirmCashSalaryPaymentModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface SalaryPaymentMonthDetailProps {
  runId: string;
  onBack: () => void;
}

export function SalaryPaymentMonthDetail({ runId, onBack }: SalaryPaymentMonthDetailProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  const [activeEmployeeForPayout, setActiveEmployeeForPayout] = useState<SalaryPaymentEmployee | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(null);

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userRole = (currentUser?.role || '').toUpperCase();
  const isAdmin =
    userRole === 'SUPER_ADMIN' ||
    userRole === 'STORE_OWNER' ||
    userRole === 'ADMIN' ||
    userRole === 'STORE_MANAGER' ||
    userRole === 'MERCHANT';

  const { data, isLoading, isError, refetch } = useGetSalaryPaymentRunDetailQuery({
    runId,
    paymentStatus: paymentStatusFilter === 'ALL' ? undefined : paymentStatusFilter,
    search: searchTerm.trim() || undefined,
  });

  const [disburseBulk, { isLoading: isBulkDisbursing }] = useDisburseSalaryPaymentBulkMutation();

  const run = data?.run || (data as any)?.data?.run;
  const rawEmployees = data?.employees || (data as any)?.data?.employees;
  const employees: SalaryPaymentEmployee[] = Array.isArray(rawEmployees) ? rawEmployees : [];

  const monthLabel = run ? MONTH_NAMES[run.month - 1] : 'Month';
  const yearLabel = run?.year || 2026;

  const now = new Date();
  const currentCalMonth = now.getMonth() + 1;
  const currentCalYear = now.getFullYear();
  const isPastMonth = run
    ? run.year < currentCalYear || (run.year === currentCalYear && run.month < currentCalMonth)
    : false;
  const isCurrentMonth = run
    ? run.year === currentCalYear && run.month === currentCalMonth
    : false;

  const isLockedForCurrentUser = isPastMonth && !isAdmin;

  // Extract unique departments for filtering
  const allDepartments = Array.from(
    new Set(employees.map((e) => e.departmentName).filter(Boolean)),
  );

  const filteredEmployees = employees.filter((emp) => {
    if (selectedDepartment !== 'ALL' && emp.departmentName !== selectedDepartment) {
      return false;
    }
    return true;
  });

  const totalPayable = Number(run?.totalNetAmount || 0);
  const totalPaid = Number(run?.totalPaidAmount || 0);
  const totalRemaining = Number(run?.remainingAmount || 0);
  const paidCount = run?.paidEmployeesCount || 0;
  const totalEmployeesCount = run?.totalEmployees || 0;
  const unpaidCount = totalEmployeesCount - paidCount;

  const paidPercentage = totalPayable > 0 ? Math.min(100, Math.round((totalPaid / totalPayable) * 100)) : 0;

  const handleBulkPayout = async () => {
    if (isLockedForCurrentUser) {
      alert('Only administrators can disburse or edit salary for previous months.');
      return;
    }

    try {
      setBulkSuccessMessage(null);
      const res = await disburseBulk({
        payrollRunId: runId,
        paymentMethod: 'CASH',
        paymentReference: `Monthly salary bulk cash payout - ${monthLabel} ${yearLabel}`,
      }).unwrap();

      if (res.success) {
        setBulkSuccessMessage(res.message);
        setIsBulkModalOpen(false);
        refetch();
      }
    } catch (err: any) {
      alert(err?.data?.message || err?.message || 'Bulk payout failed.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {monthLabel} {yearLabel} Payroll
              </h1>
              {isCurrentMonth ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Current Month</span>
                </span>
              ) : isPastMonth ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Previous Month</span>
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Approved on {run?.finalizedAt ? new Date(run.finalizedAt).toLocaleDateString() : 'N/A'} &bull; Hand Cash Disbursement Registry
            </p>
          </div>
        </div>

        {/* Bulk Payout Action */}
        <div className="flex items-center gap-3">
          {unpaidCount > 0 && (
            <button
              type="button"
              disabled={isLockedForCurrentUser}
              onClick={() => {
                if (isLockedForCurrentUser) {
                  alert('Only an Administrator can disburse or adjust salary for previous months.');
                  return;
                }
                setIsBulkModalOpen(true);
              }}
              title={isLockedForCurrentUser ? 'Only Administrator can disburse past month salary' : 'Disburse all remaining in cash'}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs transition-all ${
                isLockedForCurrentUser
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-70'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer'
              }`}
            >
              {isLockedForCurrentUser ? <Lock className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
              <span>
                {isLockedForCurrentUser
                  ? 'Locked for Staff (Admin Only)'
                  : `Disburse Remaining Cash (৳${totalRemaining.toLocaleString()})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Prior Month Policy Alert Banner */}
      {isPastMonth && (
        <div className={`rounded-2xl p-4 border flex items-start gap-3.5 shadow-2xs ${
          isAdmin
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
            isAdmin ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
          }`}>
            {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold flex items-center gap-2">
              <span>
                {isAdmin
                  ? `Administrator Access: ${monthLabel} ${yearLabel} (Prior Month)`
                  : `Previous Month Salary Locked (${monthLabel} ${yearLabel})`}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isAdmin ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
              }`}>
                {isAdmin ? 'Admin Override Active' : 'Read-Only Mode'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed mt-1 opacity-90">
              {isAdmin
                ? `You are logged in as an Administrator (${currentUser?.role}). You have permission to record disbursements, vouchers, or adjust records for this prior period.`
                : `This payroll belongs to a previous month. To protect accounting integrity and ledger balances, editing or disbursing previous month salaries is strictly limited to Store Administrators.`}
            </p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {bulkSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{bulkSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBulkSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Monthly Disbursement Progress Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Payment Progress
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">
                ৳{totalPaid.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                disbursed of ৳{totalPayable.toLocaleString()} total net
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Remaining Outflow</span>
              <span className="text-lg font-black text-rose-600">৳{totalRemaining.toLocaleString()}</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Staff Disbursed</span>
              <span className="text-lg font-black text-slate-900">
                {paidCount} <span className="text-xs font-medium text-slate-400">/ {totalEmployeesCount}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>{paidPercentage}% Completed</span>
            <span>{unpaidCount} Pending Staff</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          {allDepartments.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {allDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'UNPAID', 'PAID'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setPaymentStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paymentStatusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status === 'ALL' ? 'All' : status === 'UNPAID' ? `Unpaid (${unpaidCount})` : `Paid (${paidCount})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Payments Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-4 py-3.5 text-right">Gross Salary</th>
                <th className="px-4 py-3.5 text-right">Deductions</th>
                <th className="px-4 py-3.5 text-right">Net Payable</th>
                <th className="px-4 py-3.5 text-center">Payment Status</th>
                <th className="px-4 py-3.5">Method & Reference</th>
                <th className="px-4 py-3.5">Disbursement Details</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Loading salary payment records...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No employees matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isPaid = emp.paymentStatus === 'PAID';
                  return (
                    <tr
                      key={emp.payslipId}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isPaid ? 'bg-emerald-50/10' : ''
                      }`}
                    >
                      {/* Employee Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {emp.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{emp.fullName}</span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {emp.employeeCode} &bull; {emp.designation || 'Staff'}
                            </span>
                            <span className="text-[10px] text-blue-600 font-semibold block">
                              {emp.departmentName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Gross */}
                      <td className="px-4 py-4 text-right font-medium text-slate-700">
                        ৳{Number(emp.grossSalary).toLocaleString()}
                      </td>

                      {/* Deductions */}
                      <td className="px-4 py-4 text-right">
                        <span className="font-medium text-rose-600 block">
                          -৳{Number(emp.totalDeductions).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          PF: ৳{Number(emp.providentFundDeduction).toLocaleString()} &bull; Tax: ৳{Number(emp.taxDeduction).toLocaleString()}
                        </span>
                      </td>

                      {/* Net Payable */}
                      <td className="px-4 py-4 text-right font-black text-slate-900 text-sm">
                        ৳{Number(emp.netSalary).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Paid</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Unpaid</span>
                          </span>
                        )}
                      </td>

                      {/* Method & Ref */}
                      <td className="px-4 py-4">
                        {isPaid ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{emp.paymentMethod || 'Hand Cash'}</span>
                            </span>
                            {emp.paymentReference && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Ref: {emp.paymentReference}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Hand Cash (Pending)</span>
                        )}
                      </td>

                      {/* Disbursement Details */}
                      <td className="px-4 py-4">
                        {isPaid ? (
                          <div>
                            <span className="text-xs text-slate-700 font-semibold block">
                              {emp.paidAt ? new Date(emp.paidAt).toLocaleDateString() : 'Paid'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Cashier: Authorized User
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Disbursed</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isLockedForCurrentUser}
                            onClick={() => {
                              if (isLockedForCurrentUser) {
                                alert('Only an Administrator can disburse or edit salary for previous months.');
                                return;
                              }
                              setActiveEmployeeForPayout(emp);
                            }}
                            title={isLockedForCurrentUser ? 'Only Admin can disburse past month salary' : 'Pay Cash'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
                              isLockedForCurrentUser
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer'
                            }`}
                          >
                            {isLockedForCurrentUser ? <Lock className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}
                            <span>{isLockedForCurrentUser ? 'Locked' : 'Pay Cash'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Employee Payment Modal */}
      {activeEmployeeForPayout && (
        <ConfirmCashSalaryPaymentModal
          isOpen={!!activeEmployeeForPayout}
          onClose={() => setActiveEmployeeForPayout(null)}
          employee={activeEmployeeForPayout}
          monthName={monthLabel}
          year={yearLabel}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Bulk Payout Confirmation Dialog */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bulk Cash Disbursement</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                You are about to disburse <span className="font-bold text-slate-900">৳{totalRemaining.toLocaleString()}</span> in Hand Cash to all <span className="font-bold text-slate-900">{unpaidCount} unpaid employees</span> for {monthLabel} {yearLabel}.
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium space-y-1">
              <p className="font-bold text-emerald-950">Accounting Summary:</p>
              <p>&bull; Cash on Hand: -৳{totalRemaining.toLocaleString()} (Credit)</p>
              <p>&bull; Salaries Payable: -৳{totalRemaining.toLocaleString()} (Debit)</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDisbursing || isLockedForCurrentUser}
                onClick={handleBulkPayout}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isBulkDisbursing ? 'Processing...' : 'Confirm Bulk Cash Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
