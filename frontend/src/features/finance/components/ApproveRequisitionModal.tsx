'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Landmark,
  FileText,
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  useApproveRequisitionMutation,
  useGetAccountsQuery,
  type FinanceRequisition,
} from '../api/financeApi';
import { AccountSelectDropdown } from './AccountSelectDropdown';
import { CustomDropdown } from '@/features/purchase/components/CustomDropdown';

interface ApproveRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: FinanceRequisition | null;
  onSuccess?: () => void;
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
  const accounts = accountsData?.items ?? [];

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
      toast.error('Please select an account to disburse funds from.');
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
        `Requisition ${requisition.requisitionNumber} approved and ৳${requestedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} disbursed from ${selectedAccount?.name}!`,
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
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Approve & Disburse Requisition
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {requisition.requisitionNumber} • {requisition.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Requisition Summary Card */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Supplier / Payee
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {requisition.supplierName || 'General Supplier / Payee'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Amount Requested
                </span>
                <p className="text-base font-mono font-black text-blue-600">
                  ৳ {requestedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {requisition.poNumber && (
              <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">Linked Purchase Order:</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                  {requisition.poNumber}
                </span>
              </div>
            )}

            {requisition.items && requisition.items.length > 0 && (
              <div className="pt-2.5 border-t border-slate-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Items Breakdown ({requisition.items.length})
                </span>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {requisition.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-slate-100"
                    >
                      <span className="font-medium text-slate-700 truncate max-w-[240px]">
                        {item.productName}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {item.quantity} × ৳{Number(item.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2 })} ={' '}
                        <span className="font-bold text-slate-800">
                          ৳{Number(item.lineTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Deduct From Financial Account <span className="text-rose-500">*</span>
            </label>
            <AccountSelectDropdown
              accounts={accounts}
              value={accountId}
              onChange={(id) => setAccountId(id)}
              allowUnassigned={false}
              placeholder="Choose bank or cash account..."
            />
          </div>

          {/* Balance Preview Card */}
          {selectedAccount && (
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="font-mono font-bold text-slate-800">
                  ৳ {currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Requisition Amount:</span>
                <span className="font-mono font-bold text-rose-600">
                  - ৳ {requestedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Projected Balance:</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    projectedBalance < 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  ৳ {projectedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {projectedBalance < 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-600 bg-rose-50/70 px-2.5 py-1.5 rounded-lg border border-rose-200/60">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Warning: This disbursement will result in a negative account balance.</span>
                </div>
              )}
            </div>
          )}

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Disbursement Method
              </label>
              <CustomDropdown
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val)}
                options={[
                  {
                    value: 'BANK_TRANSFER',
                    label: 'Bank Transfer',
                    icon: <Building2 className="w-3.5 h-3.5 text-blue-600" />,
                  },
                  {
                    value: 'CASH',
                    label: 'Cash Drawer',
                    icon: <Wallet className="w-3.5 h-3.5 text-emerald-600" />,
                  },
                  {
                    value: 'MOBILE_BANKING',
                    label: 'Mobile Banking (bKash/Nagad)',
                    icon: <Smartphone className="w-3.5 h-3.5 text-pink-600" />,
                  },
                  {
                    value: 'CARD',
                    label: 'Debit / Credit Card',
                    icon: <CreditCard className="w-3.5 h-3.5 text-indigo-600" />,
                  },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Reference / Cheque #
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. CHQ-99201 or TXN-441"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition shadow-2xs"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Approval Remarks / Notes
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
              <span>{isLoading ? 'Disbursing...' : 'Approve & Disburse Funds'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
