'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  FinanceInvoice,
  FinanceAccount,
  useRecordInvoicePaymentMutation,
  useGetAccountsQuery,
} from '../api/financeApi';

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
      icon={<DollarSign className="w-5 h-5" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Payment Amount (BDT) *
          </label>
          <input
            type="number"
            step="0.01"
            max={Number(invoice.balanceDue)}
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">
            Max balance due: ৳{Number(invoice.balanceDue).toLocaleString()}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Payment Date *
          </label>
          <input
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Deposit to Account
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="">-- Direct / Unassigned --</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (৳{Number(acc.currentBalance).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
            >
              <option value="BANK">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="SSLCOMMERZ">Card / Gateway</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TR-892"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment note..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition"
          >
            {isLoading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
