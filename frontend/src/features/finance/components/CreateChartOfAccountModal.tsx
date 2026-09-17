'use client';

import React, { useState } from 'react';
import { X, FolderTree, AlertCircle } from 'lucide-react';
import {
  useCreateChartOfAccountMutation,
  useGetChartOfAccountsQuery,
  FinanceAccountClass,
  FinanceNormalBalance,
} from '../api/financeApi';

interface CreateChartOfAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateChartOfAccountModal({ isOpen, onClose }: CreateChartOfAccountModalProps) {
  const [createAccount, { isLoading }] = useCreateChartOfAccountMutation();
  const { data: coaData } = useGetChartOfAccountsQuery();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [accountClass, setAccountClass] = useState<FinanceAccountClass>('EXPENSE');
  const [subType, setSubType] = useState('OPERATING_EXPENSE');
  const [normalBalance, setNormalBalance] = useState<FinanceNormalBalance>('DEBIT');
  const [parentId, setParentId] = useState('');
  const [startingBalance, setStartingBalance] = useState('0');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleClassChange = (cls: FinanceAccountClass) => {
    setAccountClass(cls);
    if (cls === 'ASSET' || cls === 'EXPENSE') {
      setNormalBalance('DEBIT');
    } else {
      setNormalBalance('CREDIT');
    }

    if (cls === 'ASSET') setSubType('CURRENT_ASSET');
    else if (cls === 'LIABILITY') setSubType('CURRENT_LIABILITY');
    else if (cls === 'EQUITY') setSubType('EQUITY');
    else if (cls === 'REVENUE') setSubType('OPERATING_REVENUE');
    else if (cls === 'EXPENSE') setSubType('OPERATING_EXPENSE');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim() || !name.trim()) {
      setErrorMsg('Please provide both an account code and account name.');
      return;
    }

    try {
      await createAccount({
        code: code.trim(),
        name: name.trim(),
        accountClass,
        subType,
        normalBalance,
        parentId: parentId ? parentId : undefined,
        startingBalance: Number(startingBalance) || 0,
        description: description.trim() || undefined,
      }).unwrap();

      onClose();
      setCode('');
      setName('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to create chart of account. Code may already exist.');
    }
  };

  const parentAccounts = (coaData?.accounts || []).filter((a) => a.accountClass === accountClass);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Add Chart of Account</h2>
              <p className="text-xs text-slate-500 font-medium">Create a new ledger account in the General Chart</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Classification <span className="text-rose-500">*</span>
              </label>
              <select
                value={accountClass}
                onChange={(e) => handleClassChange(e.target.value as FinanceAccountClass)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 outline-hidden transition"
              >
                <option value="ASSET">Asset (1000s)</option>
                <option value="LIABILITY">Liability (2000s)</option>
                <option value="EQUITY">Equity (3000s)</option>
                <option value="REVENUE">Revenue (4000s)</option>
                <option value="EXPENSE">Expense (5000/6000s)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 6095"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-blue-500 outline-hidden transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Legal & Professional Fees"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 outline-hidden transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sub-Type</label>
              <input
                type="text"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                placeholder="e.g. OPERATING_EXPENSE"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Normal Balance</label>
              <select
                value={normalBalance}
                onChange={(e) => setNormalBalance(e.target.value as FinanceNormalBalance)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 outline-hidden transition"
              >
                <option value="DEBIT">Debit (Dr)</option>
                <option value="CREDIT">Credit (Cr)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Parent Account (Optional)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 outline-hidden transition"
            >
              <option value="">None (Top-Level Account)</option>
              {parentAccounts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Detailed description of transactions for this account..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-hidden transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
