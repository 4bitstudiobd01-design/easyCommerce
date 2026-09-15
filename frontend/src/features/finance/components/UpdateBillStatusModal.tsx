'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building2,
  Wallet,
  Landmark,
  Calendar,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  FinanceBill,
  FinanceBillStatus,
  FinanceAccount,
  useUpdateBillStatusMutation,
  useGetAccountsQuery,
} from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bill: FinanceBill | null;
}

const STATUS_OPTIONS: { value: FinanceBillStatus; label: string; desc: string }[] = [
  { value: 'PENDING', label: 'Pending', desc: 'Awaiting review or payment approval' },
  { value: 'UNPAID', label: 'Unpaid', desc: 'Approved and outstanding for payment' },
  { value: 'PAID', label: 'Paid', desc: 'Settled — deducts money and creates an Expense' },
  { value: 'OVERDUE', label: 'Overdue', desc: 'Passed the agreed due date' },
  { value: 'VOID', label: 'Void', desc: 'Cancelled bill — no monetary effect' },
];

export function UpdateBillStatusModal({ isOpen, onClose, bill }: Props) {
  const [status, setStatus] = useState<FinanceBillStatus>('PAID');
  const [accountId, setAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [paymentMethod, setPaymentMethod] = useState('BANK');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const { data: accountsData } = useGetAccountsQuery();
  const [updateBillStatus, { isLoading }] = useUpdateBillStatusMutation();

  const accounts: FinanceAccount[] = Array.isArray(accountsData)
    ? accountsData
    : (accountsData as any)?.items || [];

  useEffect(() => {
    if (bill) {
      // Default to PAID if unpaid/pending, otherwise match bill status
      if (bill.status === 'PAID') {
        setStatus('PAID');
      } else {
        setStatus('PAID');
      }
      setReference(bill.billNumber || '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [bill]);

  // Auto-select default account if not set
  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      const def = accounts.find((a) => a.isDefault) || accounts[0];
      if (def) {
        setAccountId(def.id);
        setPaymentMethod(def.type || 'BANK');
      }
    }
  }, [accounts, accountId]);

  if (!isOpen || !bill) return null;

  const wasPaid = bill.status === 'PAID';
  const isMarkingPaid = status === 'PAID';
  const isReverting = wasPaid && status !== 'PAID';

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currentBalance = Number(selectedAccount?.currentBalance || 0);
  const balDue = Number(bill.balanceDue || 0);
  const billAmount = balDue > 0 ? balDue : Number(bill.totalAmount || 0);
  const remainingBalance = currentBalance - billAmount;
  const isInsufficient = selectedAccount && remainingBalance < 0;

  const formatMoney = (val: number | string) =>
    `৳${Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isMarkingPaid && !accountId) {
      toast.error('Please select a payment account to deduct money from.');
      return;
    }

    try {
      await updateBillStatus({
        id: bill.id,
        status,
        accountId: isMarkingPaid ? accountId : undefined,
        paymentMethod: isMarkingPaid ? paymentMethod : undefined,
        paymentDate: isMarkingPaid ? paymentDate : undefined,
        reference: isMarkingPaid ? reference || undefined : undefined,
        notes: notes || undefined,
      }).unwrap();

      if (isMarkingPaid) {
        toast.success(
          `Bill #${bill.billNumber} marked as PAID. ${formatMoney(billAmount)} deducted from ${selectedAccount?.name || 'account'} and added to Expenses!`,
        );
      } else if (isReverting) {
        toast.info(
          `Bill #${bill.billNumber} reverted to ${status}. Expense transaction refunded and ledger updated.`,
        );
      } else {
        toast.success(`Bill #${bill.billNumber} status updated to ${status}.`);
      }

      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update bill status.');
    }
  };

  const getAccountIcon = (type?: string) => {
    switch (type) {
      case 'BANK':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'CASH':
        return <Landmark className="w-4 h-4 text-amber-600" />;
      case 'CARD':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'DIGITAL_WALLET':
        return <Wallet className="w-4 h-4 text-rose-600" />;
      default:
        return <Building2 className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Status: Bill #${bill.billNumber}`}
      subtitle={`Vendor: ${bill.supplierName} • Total: ${formatMoney(bill.totalAmount)}`}
      icon={<CreditCard className="w-5 h-5 text-rose-600" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Status Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Target Payment Status *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = status === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? opt.value === 'PAID'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                        : opt.value === 'VOID'
                        ? 'border-slate-400 bg-slate-100 text-slate-900 ring-2 ring-slate-400/20 shadow-xs'
                        : 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-extrabold text-xs">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500 line-clamp-2">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reversal Warning if previously paid */}
        {isReverting && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <p className="font-black text-amber-950">Reversing Paid Status</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                This bill was previously marked as Paid. Changing its status back to{' '}
                <span className="font-bold uppercase">{status}</span> will automatically refund the deducted money back to the account and cancel the Expense transaction.
              </p>
            </div>
          </div>
        )}

        {/* If marking as PAID, show Payment Account selection and live balance calculations */}
        {isMarkingPaid && (
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600" />
              <p className="text-xs font-black text-rose-950 uppercase tracking-wider">
                Deduct from Payment Account
              </p>
            </div>

            {/* Account Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Account to Pay From *
              </label>
              <select
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  const acc = accounts.find((a) => a.id === e.target.value);
                  if (acc) setPaymentMethod(acc.type || 'BANK');
                }}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type}) — Balance: {formatMoney(acc.currentBalance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Balance Deduction Preview */}
            {selectedAccount && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    {getAccountIcon(selectedAccount.type)}
                    {selectedAccount.name} Current Balance:
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatMoney(currentBalance)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-rose-600">
                  <span className="font-medium">- Bill Amount to Deduct:</span>
                  <span className="font-mono font-black text-rose-600">
                    {formatMoney(billAmount)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800">Remaining Balance:</span>
                  <span
                    className={`font-mono font-black ${
                      isInsufficient ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {formatMoney(remainingBalance)}
                  </span>
                </div>

                {isInsufficient && (
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Notice: This payment exceeds the current balance. Account will become overdrawn.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Date & Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
                >
                  <option value="BANK">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="CHECK">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Reference & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cheque / Txn ID"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading || (isMarkingPaid && !accountId)}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Updating...</span>
            ) : isMarkingPaid ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Mark as Paid (Deduct {formatMoney(billAmount)})</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Save Status: {status}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
