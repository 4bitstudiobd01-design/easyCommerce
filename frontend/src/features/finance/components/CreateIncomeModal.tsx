'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { TrendingUp, Landmark, Plus, ArrowUpRight, AlertCircle, Wallet } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  useCreateIncomeMutation,
  useGetAccountsQuery,
  useGetCategoriesQuery,
  FinanceCategory,
  FinanceAccount,
} from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialAccountId?: string;
}

export function CreateIncomeModal({ isOpen, onClose, initialAccountId }: Props) {
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [categoryCode, setCategoryCode] = useState('PRODUCT_SALES');
  const [accountId, setAccountId] = useState(initialAccountId || '');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const { data: accountsData } = useGetAccountsQuery();
  const { data: categories } = useGetCategoriesQuery({ type: 'INCOME' });
  const [createIncome, { isLoading }] = useCreateIncomeMutation();

  const rawAccounts = (accountsData as any)?.data !== undefined ? (accountsData as any).data : accountsData;
  const accounts: FinanceAccount[] = Array.isArray(rawAccounts)
    ? rawAccounts
    : (rawAccounts as any)?.items || [];
  const categoryList: FinanceCategory[] = Array.isArray(categories) ? categories : [];

  // Auto-select initial or default account
  useEffect(() => {
    if (initialAccountId) {
      setAccountId(initialAccountId);
    } else if (accounts.length > 0 && !accountId) {
      const defAcc =
        accounts.find((a) => a.isDefault && a.isActive) ||
        accounts.find((a) => a.isActive) ||
        accounts[0];
      if (defAcc) {
        setAccountId(defAcc.id);
      }
    }
  }, [initialAccountId, accounts, accountId, isOpen]);

  // Sync payment method default based on selected account
  const handleAccountChange = (newAccId: string) => {
    setAccountId(newAccId);
    const selected = accounts.find((a) => a.id === newAccId);
    if (selected) {
      if (selected.type === 'CASH') setPaymentMethod('CASH');
      else if (selected.type === 'DIGITAL_WALLET') {
        const prov = (selected.bankOrProviderName || selected.name || '').toUpperCase();
        if (prov.includes('NAGAD')) setPaymentMethod('NAGAD');
        else setPaymentMethod('BKASH');
      } else if (selected.type === 'PAYMENT_GATEWAY') setPaymentMethod('SSLCOMMERZ');
      else setPaymentMethod('BANK');
    }
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currentBal = selectedAccount ? Number(selectedAccount.currentBalance || 0) : 0;
  const incomeAmt = Number(amount || 0);
  const projectedBal = currentBal + (incomeAmt > 0 ? incomeAmt : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    try {
      await createIncome({
        amount: numAmount,
        transactionDate,
        categoryCode,
        accountId: accountId || undefined,
        description: description || undefined,
        reference: reference || undefined,
        paymentMethod: paymentMethod || undefined,
      }).unwrap();

      toast.success('Income recorded and added to account balance successfully.');
      onClose();
      setAmount('');
      setDescription('');
      setReference('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to record income.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Income"
      subtitle="Log incoming revenue and add funds to your financial payment account"
      icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Amount & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Amount (BDT) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Income Category *
            </label>
            <select
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="PRODUCT_SALES">Product Sales (COD / Online)</option>
              <option value="SHIPPING_INCOME">Shipping & Delivery Income</option>
              <option value="SERVICE_INCOME">Service & Support Income</option>
              <option value="OTHER_INCOME">Other Miscellaneous Income</option>
              {categoryList
                .filter(
                  (c) =>
                    !['PRODUCT_SALES', 'SHIPPING_INCOME', 'SERVICE_INCOME', 'OTHER_INCOME'].includes(c.code),
                )
                .map((cat) => (
                  <option key={cat.id} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Date & Receiving Account */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Receiving Account (Add Money To) *
              </label>
              {selectedAccount && (
                <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {selectedAccount.type.replace('_', ' ')}
                </span>
              )}
            </div>
            <select
              value={accountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              {accounts.length === 0 ? (
                <option value="">No accounts available</option>
              ) : (
                <>
                  <option value="">-- Direct Cash / Unassigned --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency} {Number(acc.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>

        {/* Live Balance Projection Pill */}
        {selectedAccount && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{selectedAccount.name}</p>
                <p className="text-[11px] text-slate-500">
                  Current: <span className="font-semibold text-slate-700">{selectedAccount.currency} {currentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Projected New Balance
              </span>
              <span className="font-black text-emerald-700 text-sm flex items-center justify-end gap-1">
                <ArrowUpRight className="w-4 h-4" />
                {selectedAccount.currency} {projectedBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Payment Method & Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="">-- Select Method --</option>
              <option value="CASH">Cash in Hand</option>
              <option value="BANK">Bank Transfer / EFT / Cheque</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="ROCKET">Rocket</option>
              <option value="SSLCOMMERZ">SSLCommerz / Card</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reference / Invoice #
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. INV-1049, TRX-928"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Description / Notes
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Income details, customer note, or bank transfer reference..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-1.5"
          >
            {isLoading ? 'Recording...' : 'Record & Deposit Income'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
