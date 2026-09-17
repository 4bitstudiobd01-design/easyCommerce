'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Folder,
  FileText,
  Building2,
  Package,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  ArrowLeft,
  Edit2,
  Wallet,
  ChevronLeft,
  X,
  Trash2,
} from 'lucide-react';
import {
  AccountType,
  AccountWithBalances,
  NormalBalance,
  useGetAccountTreeQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} from '../api/accountingApi';

// ─── Display helpers ─────────────────────────────────────────────────────────

const GROUP_CODE: Record<AccountType, string> = {
  ASSET: '1000',
  LIABILITY: '2000',
  EQUITY: '3000',
  REVENUE: '4000',
  EXPENSE: '5000',
};

const TYPE_LABEL: Record<AccountType, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  REVENUE: 'Income',
  EXPENSE: 'Expense',
};

const NORMAL_BALANCE_LABEL: Record<NormalBalance, 'Debit' | 'Credit'> = {
  DEBIT: 'Debit',
  CREDIT: 'Credit',
};

/** "1520.00" → "৳1,520.00" */
function formatCurrency(value: string | number | undefined): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return '৳0.00';
  return `৳${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const sampleTransactions = [
  {
    date: 'May 31, 2024',
    reference: 'JE-000124',
    description: 'Sales for Order #ORD-1050',
    debit: '-',
    credit: '25,000.00',
    balance: '1,000,000.00',
  },
  {
    date: 'May 31, 2024',
    reference: 'JE-000115',
    description: 'Sales for Order #ORD-1045',
    debit: '-',
    credit: '18,500.00',
    balance: '975,000.00',
  },
  {
    date: 'May 30, 2024',
    reference: 'JE-000110',
    description: 'Sales for Order #ORD-1040',
    debit: '-',
    credit: '32,000.00',
    balance: '956,500.00',
  },
  {
    date: 'May 29, 2024',
    reference: 'JE-000102',
    description: 'Sales for Order #ORD-1036',
    debit: '-',
    credit: '15,000.00',
    balance: '924,500.00',
  },
  {
    date: 'May 28, 2024',
    reference: 'JE-000095',
    description: 'Sales for Order #ORD-1031',
    debit: '-',
    credit: '20,000.00',
    balance: '909,500.00',
  },
];

export function ChartOfAccountsView() {
  const { data: groups = [], isLoading } = useGetAccountTreeQuery();
  const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] = useUpdateAccountMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    '1000': true,
    '2000': true,
    '3000': true,
    '4000': true,
    '5000': true,
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'transactions' | 'details'>('transactions');
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // New account form state
  const [formType, setFormType] = useState<AccountType>('ASSET');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formNormalBalance, setFormNormalBalance] = useState<NormalBalance>('CREDIT');
  const [formDescription, setFormDescription] = useState('');
  const [formOpeningBalance, setFormOpeningBalance] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState(true);

  const allAccounts = useMemo(
    () => groups.flatMap((g) => g.accounts),
    [groups],
  );

  const accountNameById = useMemo(() => {
    const map = new Map<string, string>();
    allAccounts.forEach((a) => map.set(a.id, `${a.name} (${a.code})`));
    return map;
  }, [allAccounts]);

  const selectedAccount = useMemo<AccountWithBalances | null>(() => {
    if (selectedAccountId) {
      const found = allAccounts.find((a) => a.id === selectedAccountId);
      if (found) return found;
    }
    return allAccounts[0] ?? null;
  }, [allAccounts, selectedAccountId]);

  useEffect(() => {
    if (!selectedAccountId && allAccounts.length > 0) {
      setSelectedAccountId(allAccounts[0].id);
    }
  }, [allAccounts, selectedAccountId]);

  const toggleGroup = (code: string) => {
    setOpenGroups((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const resetNewAccountForm = (type: AccountType) => {
    setFormType(type);
    setFormCode('');
    setFormName('');
    setFormNormalBalance(type === 'ASSET' || type === 'EXPENSE' ? 'DEBIT' : 'CREDIT');
    setFormDescription('');
    setFormOpeningBalance('');
  };

  const openAddSubAccountModal = (type: AccountType) => {
    resetNewAccountForm(type);
    setIsNewAccountModalOpen(true);
  };

  const openEditModal = (account: AccountWithBalances) => {
    setSelectedAccountId(account.id);
    setEditName(account.name);
    setEditDescription(account.description ?? '');
    setEditActive(account.isActive);
    setIsEditModalOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!formCode.trim() || !formName.trim()) {
      toast.error('Account code and name are required.');
      return;
    }
    try {
      const created = await createAccount({
        code: formCode.trim(),
        name: formName.trim(),
        type: formType,
        normalBalance: formNormalBalance,
        description: formDescription.trim() || undefined,
        openingBalance: formOpeningBalance ? Number(formOpeningBalance) : undefined,
      }).unwrap();
      toast.success('Account created.');
      setSelectedAccountId(created.id);
      setIsNewAccountModalOpen(false);
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || 'Failed to create account.');
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;
    if (!editName.trim()) {
      toast.error('Account name is required.');
      return;
    }
    try {
      await updateAccount({
        id: selectedAccount.id,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        isActive: editActive,
      }).unwrap();
      toast.success('Account updated.');
      setIsEditModalOpen(false);
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || 'Failed to update account.');
    }
  };

  const handleToggleStatus = async (account: AccountWithBalances) => {
    try {
      await updateAccount({ id: account.id, isActive: !account.isActive }).unwrap();
      toast.success(account.isActive ? 'Account deactivated.' : 'Account activated.');
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || 'Failed to update account status.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    try {
      const res = await deleteAccount(selectedAccount.id).unwrap();
      toast.success(res.message || 'Account deleted.');
      setIsDeleteModalOpen(false);
      setSelectedAccountId(null);
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || 'Failed to delete account.');
    }
  };

  const getAccountIcon = (name: string) => {
    if (name.includes('Bank') || name.includes('Loan') || name.includes('Payable')) {
      return <Building2 className="w-3.5 h-3.5 text-slate-400" />;
    }
    if (name.includes('Inventory') || name.includes('Packaging')) {
      return <Package className="w-3.5 h-3.5 text-slate-400" />;
    }
    return <FileText className="w-3.5 h-3.5 text-slate-400" />;
  };

  const selectedGroup = selectedAccount
    ? groups.find((g) => g.type === selectedAccount.type)
    : undefined;
  const selectedParentLabel = selectedAccount
    ? selectedAccount.parentId
      ? accountNameById.get(selectedAccount.parentId) ??
        `${selectedGroup?.label ?? TYPE_LABEL[selectedAccount.type]} (${GROUP_CODE[selectedAccount.type]})`
      : `${selectedGroup?.label ?? TYPE_LABEL[selectedAccount.type]} (${GROUP_CODE[selectedAccount.type]})`
    : '';

  return (
    <div className="space-y-6 w-full pb-10">
      {/* 2-Column Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Accounts Tree (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 space-y-4">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Chart of Accounts</h1>
            <p className="text-xs text-slate-500 mt-1">Manage all your accounts in the chart of accounts.</p>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <button
              type="button"
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition"
              title="Filters"
            >
              <Filter className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => openAddSubAccountModal('ASSET')}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Account</span>
            </button>
          </div>

          {/* Account Hierarchy Tree Table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>ACCOUNT NAME</span>
              <span>ACCOUNT CODE</span>
            </div>

            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-4 space-y-2 bg-white">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <div className="px-4 py-12 text-center bg-white">
                  <Folder className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700">No accounts yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click "New Account" to add your first account.
                  </p>
                </div>
              ) : (
                groups.map((group) => {
                  const groupCode = GROUP_CODE[group.type];
                  const isOpen = !!openGroups[groupCode];
                  return (
                    <div key={group.type} className="bg-white">
                      {/* Group Header Row */}
                      <div
                        onClick={() => toggleGroup(groupCode)}
                        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/40 hover:bg-slate-50 cursor-pointer font-bold text-slate-900 transition select-none"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                              isOpen ? '' : '-rotate-90'
                            }`}
                          />
                          <Folder className="w-3.5 h-3.5 text-slate-600 fill-slate-100" />
                          <span>{group.label}</span>
                        </div>
                        <span className="font-mono text-slate-900 font-bold">{groupCode}</span>
                      </div>

                      {/* Sub Accounts List */}
                      {isOpen && (
                        <div className="divide-y divide-slate-50 pl-4 bg-white">
                          {group.accounts
                            .filter((acc) =>
                              acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              acc.code.includes(searchTerm)
                            )
                            .map((acc) => {
                              const isSelected = selectedAccount?.id === acc.id;
                              return (
                                <div
                                  key={acc.id}
                                  onClick={() => setSelectedAccountId(acc.id)}
                                  className={`flex items-center justify-between px-3.5 py-2 hover:bg-blue-50/50 cursor-pointer transition ${
                                    isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {getAccountIcon(acc.name)}
                                    <span className={isSelected ? 'text-blue-600 font-semibold' : ''}>
                                      {acc.name}
                                    </span>
                                    {!acc.isActive && (
                                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-500">
                                        Inactive
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-slate-500 text-[11px]">{acc.code}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(acc);
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                          {/* Add Sub Account Action */}
                          <div className="px-3.5 py-2">
                            <button
                              type="button"
                              onClick={() => openAddSubAccountModal(group.type)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Sub Account</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Account Details & Transactions Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Detail Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 space-y-6">
            {isLoading || !selectedAccount ? (
              <div className="space-y-4">
                <div className="h-6 w-48 rounded-lg bg-slate-100 animate-pulse" />
                <div className="h-4 w-72 rounded-lg bg-slate-100 animate-pulse" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Top Navigation & Edit Action */}
                <div className="flex items-center justify-between pb-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to all accounts</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedAccount)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl text-xs font-semibold text-rose-600 shadow-sm transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Account Title Header */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedAccount.name} ({selectedAccount.code})
                      </h2>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(selectedAccount)}
                        disabled={isUpdating}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition disabled:opacity-50 ${
                          selectedAccount.isActive
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {selectedAccount.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">{selectedAccount.description}</p>
                    <div className="pt-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600">
                        {TYPE_LABEL[selectedAccount.type]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 KPI Balances Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100">
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">Opening Balance</span>
                    <div className="text-sm font-bold text-slate-900 mt-1 font-mono">
                      {formatCurrency(selectedAccount.openingBalance)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">Total Debit</span>
                    <div className="text-sm font-bold text-emerald-600 mt-1 font-mono">
                      {formatCurrency(selectedAccount.totalDebit)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">Total Credit</span>
                    <div className="text-sm font-bold text-rose-500 mt-1 font-mono">
                      {formatCurrency(selectedAccount.totalCredit)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">Closing Balance</span>
                    <div className="text-base font-extrabold text-slate-900 mt-1 font-mono tracking-tight">
                      {formatCurrency(selectedAccount.closingBalance)}
                    </div>
                  </div>
                </div>

                {/* 2-Column Metadata Grid */}
                <div className="grid grid-cols-2 gap-y-3.5 text-xs">
                  <div className="flex items-center">
                    <span className="w-36 text-slate-400 font-medium">Account Type</span>
                    <span className="font-semibold text-slate-900">{TYPE_LABEL[selectedAccount.type]}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 text-slate-400 font-medium">Account Code</span>
                    <span className="font-mono font-semibold text-slate-900">{selectedAccount.code}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 text-slate-400 font-medium">Account Category</span>
                    <span className="font-semibold text-slate-900">{selectedGroup?.label ?? TYPE_LABEL[selectedAccount.type]}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 text-slate-400 font-medium">Parent Account</span>
                    <span className="font-semibold text-slate-900">{selectedParentLabel}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 text-slate-400 font-medium">Normal Balance</span>
                    <span className="font-semibold text-slate-900">
                      {NORMAL_BALANCE_LABEL[selectedAccount.normalBalance]}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-36 text-slate-400 font-medium">Status</span>
                    <span className="font-semibold text-slate-900">
                      {selectedAccount.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Card: Tabs & Recent Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* Tabs Header */}
            <div className="flex items-center gap-6 px-6 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setActiveDetailTab('transactions')}
                className={`py-3.5 text-xs font-bold border-b-2 transition ${
                  activeDetailTab === 'transactions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Recent Transactions
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('details')}
                className={`py-3.5 text-xs font-bold border-b-2 transition ${
                  activeDetailTab === 'details'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Account Details
              </button>
            </div>

            {/* Tab 1: Transactions Table */}
            {activeDetailTab === 'transactions' ? (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5 font-bold">DATE</th>
                        <th className="px-6 py-3.5 font-bold">REFERENCE</th>
                        <th className="px-6 py-3.5 font-bold">DESCRIPTION</th>
                        <th className="px-6 py-3.5 font-bold">DEBIT (৳)</th>
                        <th className="px-6 py-3.5 font-bold">CREDIT (৳)</th>
                        <th className="px-6 py-3.5 font-bold">BALANCE (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[12px]">
                      {sampleTransactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                          <td className="px-6 py-3.5 text-slate-900 font-sans font-medium whitespace-nowrap">
                            {tx.date}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                            >
                              {tx.reference}
                            </button>
                          </td>
                          <td className="px-6 py-3.5 font-sans font-semibold text-slate-900 whitespace-nowrap">
                            {tx.description}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-slate-400 whitespace-nowrap">
                            {tx.debit}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                            {tx.credit}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                            {tx.balance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <Link
                    href="/dashboard/accounting/accounts/ledger"
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View all transactions
                  </Link>

                  <div className="flex items-center gap-3">
                    {/* Per Page */}
                    <div className="relative">
                      <select className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer">
                        <option>5 per page</option>
                        <option>10 per page</option>
                        <option>20 per page</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center gap-1 font-sans">
                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
                        disabled
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-sm shadow-blue-600/20"
                      >
                        1
                      </button>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-medium transition"
                      >
                        2
                      </button>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-medium transition"
                      >
                        3
                      </button>
                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: Account Details */
              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  {selectedAccount?.description || 'No description provided'}. All transactions posted to
                  this general ledger account are validated against standard double-entry constraints.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Type:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedAccount ? TYPE_LABEL[selectedAccount.type] : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Normal Balance:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedAccount ? NORMAL_BALANCE_LABEL[selectedAccount.normalBalance] : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Account Modal */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">Add an account to your Chart of Accounts tree</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewAccountModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent Account Group</label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const t = e.target.value as AccountType;
                      setFormType(t);
                      setFormNormalBalance(t === 'ASSET' || t === 'EXPENSE' ? 'DEBIT' : 'CREDIT');
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="ASSET">Assets (1000)</option>
                    <option value="LIABILITY">Liabilities (2000)</option>
                    <option value="EQUITY">Equity (3000)</option>
                    <option value="REVENUE">Income (4000)</option>
                    <option value="EXPENSE">Expenses (5000)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Code</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. 4030"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Wholesale Income"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Balance</label>
                  <input
                    type="number"
                    value={formOpeningBalance}
                    onChange={(e) => setFormOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Normal Balance</label>
                  <select
                    value={formNormalBalance}
                    onChange={(e) => setFormNormalBalance(e.target.value as NormalBalance)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="CREDIT">Credit</option>
                    <option value="DEBIT">Debit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of the account purpose..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewAccountModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAccount}
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {isEditModalOpen && selectedAccount && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Account: {selectedAccount.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Update account properties and classification</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Code</label>
                  <input
                    type="text"
                    value={selectedAccount.code}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editActive ? 'Active' : 'Inactive'}
                    onChange={(e) => setEditActive(e.target.value === 'Active')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateAccount}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && selectedAccount && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Delete Account?</h3>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete{' '}
              <strong>
                {selectedAccount.name} ({selectedAccount.code})
              </strong>
              ? System accounts and accounts with postings cannot be deleted and must be deactivated
              instead.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-rose-600/20 transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
