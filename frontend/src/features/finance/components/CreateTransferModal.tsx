'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeftRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  useCreateTransferMutation,
  useGetAccountsQuery,
  FinanceAccount,
} from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialFromAccountId?: string;
}

export function CreateTransferModal({ isOpen, onClose, initialFromAccountId }: Props) {
  const [fromAccountId, setFromAccountId] = useState(initialFromAccountId || '');

  React.useEffect(() => {
    if (initialFromAccountId) {
      setFromAccountId(initialFromAccountId);
    }
  }, [initialFromAccountId, isOpen]);
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const { data: accountsData } = useGetAccountsQuery();
  const [createTransfer, { isLoading }] = useCreateTransferMutation();

  const accounts: FinanceAccount[] = Array.isArray(accountsData)
    ? accountsData
    : (accountsData as any)?.items || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      toast.error('Please select both source and destination accounts.');
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error('Source and destination accounts must be different.');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid transfer amount.');
      return;
    }

    try {
      await createTransfer({
        fromAccountId,
        toAccountId,
        amount: numAmount,
        fee: Number(fee) || 0,
        transferDate,
        reference: reference || undefined,
        notes: notes || undefined,
      }).unwrap();

      toast.success('Funds transferred successfully.');
      onClose();
      setAmount('');
      setFee('');
      setReference('');
      setNotes('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to transfer funds.');
    }
  };

  const selectedFromAccount = accounts.find((a) => a.id === fromAccountId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Funds"
      subtitle="Transfer money between your accounts (non-revenue internal shift)"
      icon={<ArrowLeftRight className="w-5 h-5" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              From Account *
            </label>
            <select
              required
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">-- Select Source Account --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (৳{Number(acc.currentBalance).toLocaleString()})
                </option>
              ))}
            </select>
            {selectedFromAccount && (
              <p className="text-xs text-slate-500 mt-1">
                Available: ৳{Number(selectedFromAccount.currentBalance).toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              To Account *
            </label>
            <select
              required
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">-- Select Destination Account --</option>
              {accounts
                .filter((a) => a.id !== fromAccountId)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (৳{Number(acc.currentBalance).toLocaleString()})
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Transfer Amount (BDT) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Transfer Fee / Gateway Charge (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Transfer Date *
            </label>
            <input
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reference / Bank Txn ID
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TR-2026-9812, Payout ID"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Transfer reason or remarks..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition"
          >
            {isLoading ? 'Transferring...' : 'Execute Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
