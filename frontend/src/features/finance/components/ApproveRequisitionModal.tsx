'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Landmark,
  TrendingDown,
} from 'lucide-react';
import {
  useApproveRequisitionMutation,
  useGetAccountsQuery,
  type FinanceAccount,
  type FinanceRequisition,
} from '../api/financeApi';
import { AccountSelectDropdown } from './AccountSelectDropdown';

interface ApproveRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: FinanceRequisition | null;
  onSuccess?: () => void;
}

function formatMoney(amount: string | number | undefined): string {
  const num = Number(amount || 0);
  return '৳' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ApproveRequisitionModal({
  isOpen,
  onClose,
  requisition,
  onSuccess,
}: ApproveRequisitionModalProps) {
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  const { data: accountsData } = useGetAccountsQuery();
  const accounts = useMemo(() => accountsData?.items ?? [], [accountsData]);

  // Pre-select default account or first active account when modal opens
  useEffect(() => {
    if (isOpen && accounts.length > 0) {
      const exists = accounts.some((a) => a.id === accountId);
      if (!accountId || !exists) {
        const defaultAcc =
          accounts.find((a) => a.isDefault && a.isActive) ||
          accounts.find((a) => a.type === 'BANK' && a.isActive) ||
          accounts.find((a) => a.isActive) ||
          accounts[0];
        if (defaultAcc) {
          setAccountId(defaultAcc.id);
          applyPaymentMethod(defaultAcc);
        }
      }
    }
  }, [isOpen, accounts, accountId]);

  const applyPaymentMethod = (acc?: FinanceAccount) => {
    if (!acc) return;
    if (acc.type === 'CASH') setPaymentMethod('CASH');
    else if (acc.type === 'DIGITAL_WALLET') setPaymentMethod('MOBILE_BANKING');
    else if (acc.type === 'CARD') setPaymentMethod('CARD');
    else setPaymentMethod('BANK_TRANSFER');
  };

  const [approveRequisition, { isLoading }] = useApproveRequisitionMutation();

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === accountId);
  }, [accounts, accountId]);

  const requestedAmount = useMemo(() => {
    return Number(requisition?.requestedAmount || 0);
  }, [requisition]);

  const currentBalance = useMemo(() => {
    return Number(selectedAccount?.currentBalance || 0);
  }, [selectedAccount]);

  const projectedBalance = currentBalance - requestedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requisition) return;

    if (!accountId) {
      toast.error('Please select an account to deduct funds from.');
      return;
    }

    try {
      await approveRequisition({
        id: requisition.id,
        accountId,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        notes: notes.trim() || undefined,
      }).unwrap();

      toast.success(
        `Requisition ${requisition.requisitionNumber} approved and ${formatMoney(requestedAmount)} deducted from ${selectedAccount?.name}!`,
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to approve requisition.');
    }
  };

  if (!isOpen || !requisition) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shadow-2xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Approve &amp; Disburse Requisition
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {requisition.requisitionNumber} • {requisition.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Requisition Summary Card */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Beneficiary / Supplier
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {requisition.supplierName || 'General Supplier / Payee'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Amount Requested
                </span>
                <p className="text-xl font-mono font-black text-blue-600">
                  {formatMoney(requestedAmount)}
                </p>
              </div>
            </div>

            {requisition.poNumber && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Linked Purchase Order:</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                  {requisition.poNumber}
                </span>
              </div>
            )}
          </div>

          {/* Account Dropdown & Payment Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Deduct From Financial Account <span className="text-rose-500">*</span>
              </label>
              <AccountSelectDropdown
                accounts={accounts}
                value={accountId}
                onChange={(id, acc) => {
                  setAccountId(id);
                  applyPaymentMethod(acc);
                }}
                allowUnassigned={false}
                placeholder="Select account to deduct from..."
              />
              {accounts.length === 0 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>No accounts found. Add an account first.</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Payment Reference / Cheque #
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. CHQ-99201 or TXN-441"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition shadow-2xs h-[52px]"
              />
            </div>
          </div>

          {/* Deduction Balance Preview */}
          {selectedAccount && (
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 pb-2 border-b border-slate-200/70">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-blue-600" />
                  <span>Deduction Impact on {selectedAccount.name}:</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                  {selectedAccount.type}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Balance</span>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                    {formatMoney(currentBalance)}
                  </p>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-2xs">
                  <span className="text-[10px] text-rose-500 font-bold uppercase block">Deduction</span>
                  <p className="text-xs font-mono font-bold text-rose-600 mt-0.5">
                    - {formatMoney(requestedAmount)}
                  </p>
                </div>

                <div className={`p-2.5 rounded-xl border shadow-2xs ${
                  projectedBalance < 0 ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50/70 border-emerald-200'
                }`}>
                  <span className={`text-[10px] font-bold uppercase block ${
                    projectedBalance < 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}>
                    Remaining Balance
                  </span>
                  <p className={`text-xs font-mono font-black mt-0.5 ${
                    projectedBalance < 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}>
                    {formatMoney(projectedBalance)}
                  </p>
                </div>
              </div>

              {projectedBalance < 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>Warning: This disbursement exceeds the account balance and will make it negative.</span>
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Approval Remarks / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional disbursement note or terms..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition shadow-2xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !accountId}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs shadow-blue-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isLoading
                  ? 'Disbursing...'
                  : `Approve & Disburse Funds`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
