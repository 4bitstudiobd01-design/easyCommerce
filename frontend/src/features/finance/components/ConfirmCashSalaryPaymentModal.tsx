'use client';

import React, { useState } from 'react';
import {
  Banknote,
  X,
  CreditCard,
  Smartphone,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Calendar,
  Wallet,
} from 'lucide-react';
import {
  FinanceAccount,
  SalaryPaymentEmployee,
  SalaryPaymentMethod,
  useDisburseSalaryPaymentMutation,
  useGetAccountsQuery,
} from '../api/financeApi';

interface ConfirmCashSalaryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: SalaryPaymentEmployee | null;
  monthName: string;
  year: number;
  onSuccess?: () => void;
}

export function ConfirmCashSalaryPaymentModal({
  isOpen,
  onClose,
  employee,
  monthName,
  year,
  onSuccess,
}: ConfirmCashSalaryPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<SalaryPaymentMethod>('CASH');
  const [accountId, setAccountId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: accountsData, isLoading: accountsLoading } = useGetAccountsQuery();
  const [disbursePayment, { isLoading: isDisbursing }] = useDisburseSalaryPaymentMutation();

  if (!isOpen || !employee) return null;

  const accounts = accountsData?.items || [];
  // Prefer cash account by default
  const defaultCashAccount = accounts.find((a: any) => a.type === 'CASH' || a.name?.toLowerCase().includes('cash')) || accounts[0];
  const selectedAccountId = accountId || defaultCashAccount?.id || '';

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const res = await disbursePayment({
        payslipId: employee.payslipId,
        paymentMethod,
        accountId: selectedAccountId || undefined,
        paymentDate,
        paymentReference: paymentReference.trim() || `Cash salary voucher #${employee.employeeCode}-${year}`,
      }).unwrap();

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to disburse salary payment. Please try again.');
    }
  };

  const netAmount = Number(employee.netSalary || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-linear-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/20">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Confirm Cash Salary Payment</h3>
              <p className="text-xs text-emerald-100/90 font-medium">
                {monthName} {year} &bull; Hand Cash Disbursement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConfirm} className="p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Employee & Amount Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                  {employee.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">{employee.fullName}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {employee.employeeCode} &bull; {employee.designation} ({employee.departmentName})
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs">
              <div className="bg-white p-2 rounded-xl border border-slate-200/60 text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross</span>
                <span className="font-semibold text-slate-700">৳{Number(employee.grossSalary).toLocaleString()}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200/60 text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Deductions</span>
                <span className="font-semibold text-rose-600">-৳{Number(employee.totalDeductions).toLocaleString()}</span>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200/60 text-center">
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Net Cash</span>
                <span className="font-bold text-emerald-800 text-sm">৳{netAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'CASH', label: 'Hand Cash', icon: Banknote },
                { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: CreditCard },
                { key: 'MOBILE_BANKING', label: 'bKash / Nagad', icon: Smartphone },
                { key: 'CHEQUE', label: 'Cheque', icon: FileCheck2 },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPaymentMethod(m.key as SalaryPaymentMethod)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      active
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${active ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold leading-tight">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash / Finance Account Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Disburse From Account</span>
              {defaultCashAccount && (
                <span className="text-[11px] font-normal text-slate-500">
                  Balance: ৳{Number(defaultCashAccount.currentBalance || 0).toLocaleString()}
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={selectedAccountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 appearance-none"
              >
                {accounts.map((acc: FinanceAccount) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type}) — Balance: ৳{Number(acc.currentBalance || 0).toLocaleString()}
                  </option>
                ))}
              </select>
              <Wallet className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Payment Date & Voucher Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Voucher / Reference No.
              </label>
              <input
                type="text"
                placeholder={`e.g. CASH-VOUCHER-${employee.employeeCode}`}
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Accounting Impact Explainer */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed font-medium">
              <span className="font-bold text-emerald-950">Accounting Impact:</span> Recording this payout will Debit{' '}
              <span className="font-bold">2030 Salaries Payable</span> and Credit{' '}
              <span className="font-bold">1010 Cash on Hand</span> by ৳{netAmount.toLocaleString()}.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDisbursing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Banknote className="w-4 h-4" />
              <span>{isDisbursing ? 'Processing Cash Payout...' : `Confirm Cash Payout (৳${netAmount.toLocaleString()})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
