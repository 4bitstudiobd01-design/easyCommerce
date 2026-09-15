'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowDownLeft, Landmark, DollarSign, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  FinanceAccount,
  useDepositToAccountMutation,
  useGetAccountsQuery,
} from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  account: FinanceAccount | null;
}

const DEPOSIT_SOURCES = [
  { code: 'CAPITAL_INJECTION', label: 'Owner Capital / Investment' },
  { code: 'CASH_INFLOW', label: 'Cash Inflow / Drawer Replenishment' },
  { code: 'DIRECT_DEPOSIT', label: 'Customer Direct Deposit / Advance' },
  { code: 'INVESTMENT_LOAN', label: 'Partner Funding / Business Loan' },
  { code: 'TOP_UP', label: 'MFS / Gateway Wallet Top-Up' },
  { code: 'OTHER_INCOME', label: 'Other Operating Inflow' },
];

export function DepositToAccountModal({ isOpen, onClose, account }: Props) {
  const { data: accountsData } = useGetAccountsQuery();
  const [depositToAccount, { isLoading }] = useDepositToAccountMutation();

  const accounts: FinanceAccount[] = Array.isArray(accountsData)
    ? accountsData
    : (accountsData as any)?.items || [];

  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [depositDate, setDepositDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [categoryCode, setCategoryCode] = useState('CAPITAL_INJECTION');
  const [paymentMethod, setPaymentMethod] = useState('BANK');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (account) {
      setAccountId(account.id);
      if (account.type === 'CASH') setPaymentMethod('CASH');
      else if (account.type === 'DIGITAL_WALLET') setPaymentMethod('BKASH');
      else setPaymentMethod('BANK');
    } else if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [account, accounts, accountId]);

  if (!isOpen) return null;

  const targetAccount = accounts.find((a) => a.id === accountId) || account;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    if (!accountId) {
      toast.error('Please select an account.');
      return;
    }

    const selectedSource = DEPOSIT_SOURCES.find((s) => s.code === categoryCode);

    try {
      await depositToAccount({
        accountId,
        amount: numAmount,
        depositDate,
        categoryCode,
        source: selectedSource?.label || 'Fund Deposit',
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      }).unwrap();

      toast.success(
        `৳${numAmount.toLocaleString()} deposited into ${targetAccount?.name || 'account'} successfully!`,
      );
      onClose();

      // Reset form
      setAmount('');
      setReference('');
      setNotes('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to deposit money.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Money / Fund Deposit"
      subtitle="Credit funds into your bank, card, cash register, or mobile wallet"
      icon={<ArrowDownLeft className="w-5 h-5 text-emerald-600" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Account Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Deposit To Account *
          </label>
          <select
            required
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} — Current: ৳{Number(acc.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </option>
            ))}
          </select>
          {targetAccount && (
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Account Type: <strong className="text-slate-700">{targetAccount.type}</strong></span>
              <span>Liquid Balance: <strong className="text-emerald-600">৳{Number(targetAccount.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
            </p>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Amount (BDT) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Deposit Date & Source Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Deposit Date *
            </label>
            <input
              type="date"
              required
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Deposit Source / Purpose *
            </label>
            <select
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {DEPOSIT_SOURCES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment Method & Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="BANK">Bank Deposit / Transfer</option>
              <option value="CASH">Cash in Hand</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="ROCKET">Rocket</option>
              <option value="CHEQUE">Bank Cheque</option>
              <option value="GATEWAY">Online Gateway Settlement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Deposit Slip / Reference #
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. SLIP-9821, TrxID"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Note / Description
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Initial operating cash injected by owner"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
            className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2"
          >
            {isLoading ? 'Depositing...' : 'Add Money to Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
