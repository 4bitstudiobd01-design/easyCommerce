'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { DollarSign, Calendar, CreditCard, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  FinanceInvoice,
  FinanceAccount,
  useRecordInvoicePaymentMutation,
  useGetAccountsQuery,
} from '../api/financeApi';
import { AccountSelectDropdown } from './AccountSelectDropdown';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoice: FinanceInvoice | null;
}

export function RecordInvoicePaymentModal({ isOpen, onClose, invoice }: Props) {
  const [amount, setAmount] = useState(invoice ? invoice.balanceDue : '');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const { data: accountsData } = useGetAccountsQuery();
  const [recordPayment, { isLoading }] = useRecordInvoicePaymentMutation();

  const accounts: FinanceAccount[] = Array.isArray(accountsData)
    ? accountsData
    : (accountsData as any)?.items || [];

  React.useEffect(() => {
    if (invoice) {
      setAmount(invoice.balanceDue);
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currentBalance = Number(selectedAccount?.currentBalance || 0);
  const paymentNum = Number(amount || 0);
  const projectedBalance = currentBalance + paymentNum;

  const formatMoney = (val: number | string) =>
    '৳' +
    Number(val || 0).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    try {
      await recordPayment({
        id: invoice.id,
        amount: numAmount,
        paymentDate,
        accountId: accountId || undefined,
        paymentMethod: paymentMethod || undefined,
        reference: reference || undefined,
        notes: notes || undefined,
      }).unwrap();

      toast.success('Payment recorded successfully.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to record payment.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for #${invoice.invoiceNumber}`}
      subtitle={`Customer: ${invoice.customerName} • Outstanding: ৳${Number(invoice.balanceDue).toLocaleString()}`}
      icon={<DollarSign className="w-5 h-5 text-blue-600" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Payment Amount */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Payment Amount (BDT) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
              ৳
            </span>
            <input
              type="number"
              step="0.01"
              max={Number(invoice.balanceDue)}
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono transition"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Outstanding balance: <strong className="text-slate-700">{formatMoney(invoice.balanceDue)}</strong>
          </p>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Payment Date *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
        </div>

        {/* Deposit to Account Custom Dropdown */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Deposit to Account
          </label>
          <AccountSelectDropdown
            accounts={accounts}
            value={accountId}
            onChange={(newId: string, acc?: FinanceAccount) => {
              setAccountId(newId);
              if (acc) {
                if (acc.type === 'DIGITAL_WALLET') setPaymentMethod('BKASH');
                else if (acc.type === 'CASH') setPaymentMethod('CASH');
                else if (acc.type === 'CARD') setPaymentMethod('SSLCOMMERZ');
                else setPaymentMethod('BANK');
              }
            }}
            allowUnassigned={true}
            unassignedLabel="Direct / Unassigned"
            unassignedSubtitle="Record payment without linking to a specific ledger account"
          />
        </div>

        {/* Live Balance Impact Preview when an account is selected */}
        {selectedAccount && paymentNum > 0 && (
          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>{selectedAccount.name} Balance:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatMoney(currentBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between font-black text-blue-950 pt-1 border-t border-blue-100/80">
              <span className="flex items-center gap-1">
                Projected New Balance <ArrowRight className="w-3 h-3 text-blue-600" />
              </span>
              <span className="font-mono font-black text-blue-700">
                {formatMoney(projectedBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Method & Reference */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer transition"
              >
                <option value="BANK">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="SSLCOMMERZ">Card / Gateway</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TR-892"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add payment notes..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-2"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Recording...' : 'Record Payment'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
