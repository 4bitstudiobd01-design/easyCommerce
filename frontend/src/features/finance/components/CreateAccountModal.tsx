'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Landmark } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  FinanceAccountType,
  useCreateAccountMutation,
} from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAccountModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FinanceAccountType>('BANK');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankOrProviderName, setBankOrProviderName] = useState('');
  const [startingBalance, setStartingBalance] = useState('0');
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');

  const [createAccount, { isLoading }] = useCreateAccountMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter an account name.');
      return;
    }

    try {
      await createAccount({
        name,
        type,
        accountNumber: accountNumber || undefined,
        bankOrProviderName: bankOrProviderName || undefined,
        startingBalance: Number(startingBalance) || 0,
        isDefault,
        notes: notes || undefined,
      }).unwrap();

      toast.success('Account created successfully.');
      onClose();
      setName('');
      setAccountNumber('');
      setBankOrProviderName('');
      setStartingBalance('0');
      setIsDefault(false);
      setNotes('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create account.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Financial Account"
      subtitle="Connect or create cash drawer, bank account, or payment gateway"
      icon={<Landmark className="w-5 h-5" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Account Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. City Bank Primary, Main Cash Drawer"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Account Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FinanceAccountType)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="BANK">Bank Account</option>
              <option value="CASH">Cash in Hand / Cash Drawer</option>
              <option value="PAYMENT_GATEWAY">Payment Gateway (SSLCommerz, etc.)</option>
              <option value="DIGITAL_WALLET">Digital Wallet (bKash, Nagad)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Bank / Gateway Provider Name
            </label>
            <input
              type="text"
              value={bankOrProviderName}
              onChange={(e) => setBankOrProviderName(e.target.value)}
              placeholder="e.g. City Bank, bKash, SSLCommerz"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Account / Wallet Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 1102938472901"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Starting Balance (BDT)
            </label>
            <input
              type="number"
              step="0.01"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-slate-700">
                Set as Default Primary Account
              </span>
            </label>
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
            placeholder="Account details, branch name, or internal note..."
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
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
