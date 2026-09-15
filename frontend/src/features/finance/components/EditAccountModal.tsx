'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Settings2, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  FinanceAccount,
  FinanceAccountType,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  account: FinanceAccount | null;
}

export function EditAccountModal({ isOpen, onClose, account }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FinanceAccountType>('BANK');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankOrProviderName, setBankOrProviderName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [updateAccount, { isLoading: isUpdating }] = useUpdateAccountMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  useEffect(() => {
    if (account) {
      setName(account.name || '');
      setType(account.type || 'BANK');
      setAccountNumber(account.accountNumber || '');
      setBankOrProviderName(account.bankOrProviderName || '');
      setIsDefault(Boolean(account.isDefault));
      setIsActive(Boolean(account.isActive));
      setNotes(account.notes || '');
      setIsConfirmingDelete(false);
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter an account name.');
      return;
    }

    try {
      await updateAccount({
        id: account.id,
        name: name.trim(),
        type,
        accountNumber: accountNumber.trim() || undefined,
        bankOrProviderName: bankOrProviderName.trim() || undefined,
        isDefault,
        isActive,
        notes: notes.trim() || undefined,
      }).unwrap();

      toast.success('Account updated successfully.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update account.');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteAccount(account.id).unwrap();
      if (res.deactivated) {
        toast.info(res.message);
      } else {
        toast.success(res.message || 'Account removed successfully.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to remove account.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${account.name}`}
      subtitle={`Type: ${account.type} • Current Balance: ৳${Number(account.currentBalance || 0).toLocaleString()}`}
      icon={<Settings2 className="w-5 h-5 text-slate-700" />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Account Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Account Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FinanceAccountType)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
            >
              <option value="BANK">Bank Account</option>
              <option value="CARD">Card</option>
              <option value="CASH">Cash Drawer</option>
              <option value="DIGITAL_WALLET">Mobile Wallet (bKash/Nagad)</option>
              <option value="PAYMENT_GATEWAY">Online Gateway</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Provider / Bank
            </label>
            <input
              type="text"
              value={bankOrProviderName}
              onChange={(e) => setBankOrProviderName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Account Number / Masked Card
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white"
          />
        </div>

        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-700">Set as Primary Default Account</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-xs font-bold text-slate-700">Account is Active for transactions</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {!isConfirmingDelete ? (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Account
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 font-bold">Confirm delete?</span>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
