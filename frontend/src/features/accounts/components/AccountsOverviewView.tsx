'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  AlertCircle,
  Clock,
  Landmark,
  BookOpen,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  useGetFinanceOverviewQuery,
  useGetInvoicesQuery,
  useGetBillsQuery,
  useGetTransactionsQuery,
} from '@/features/finance/api/financeApi';

export function AccountsOverviewView() {
  const { data: overview, isLoading } = useGetFinanceOverviewQuery({});
  const { data: invoicesData } = useGetInvoicesQuery({});
  const { data: billsData } = useGetBillsQuery({});
  const { data: txData } = useGetTransactionsQuery({});

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '৳0.00';
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const invoices = (invoicesData as any)?.items ?? (invoicesData as any)?.invoices ?? (invoicesData as any)?.data ?? [];
  const bills = (billsData as any)?.items ?? (billsData as any)?.bills ?? (billsData as any)?.data ?? [];
  const transactions = (txData as any)?.items ?? (txData as any)?.transactions ?? (txData as any)?.data ?? [];

  const outstandingInvoices = invoices.filter((inv: any) =>
    ['SENT', 'UNPAID', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status),
  );
  const outstandingBills = bills.filter((bill: any) =>
    ['PENDING', 'UNPAID', 'APPROVED', 'PARTIALLY_PAID', 'OVERDUE'].includes(bill.status),
  );
  const overdueInvoices = invoices.filter((inv: any) => inv.status === 'OVERDUE');
  const overdueBills = bills.filter((bill: any) => bill.status === 'OVERDUE');

  const totalAR = outstandingInvoices.reduce(
    (sum: number, inv: any) => sum + (Number(inv.totalAmount ?? 0) - Number(inv.amountPaid ?? 0)),
    0,
  );
  const totalAP = outstandingBills.reduce(
    (sum: number, bill: any) => sum + (Number(bill.totalAmount ?? 0) - Number(bill.amountPaid ?? 0)),
    0,
  );

  const totalCredits = (overview as any)?.summary?.totalRevenue ?? 0;
  const totalDebits = (overview as any)?.summary?.totalExpenses ?? 0;
  const cashBalance = (overview as any)?.summary?.cashAndBank ?? 0;

  const kpiCards = [
    {
      label: 'Total Credits (Revenue)',
      value: formatCurrency(totalCredits),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Total Debits (Expenses)',
      value: formatCurrency(totalDebits),
      icon: TrendingDown,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
    },
    {
      label: 'Accounts Receivable',
      value: formatCurrency(totalAR),
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      sub: `${outstandingInvoices.length} outstanding invoice${outstandingInvoices.length !== 1 ? 's' : ''}`,
    },
    {
      label: 'Accounts Payable',
      value: formatCurrency(totalAP),
      icon: Receipt,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      sub: `${outstandingBills.length} outstanding bill${outstandingBills.length !== 1 ? 's' : ''}`,
    },
    {
      label: 'Cash & Bank Balance',
      value: formatCurrency(cashBalance),
      icon: Landmark,
      color: 'text-slate-700',
      bg: 'bg-slate-50',
      border: 'border-slate-100',
    },
    {
      label: 'Overdue Invoices',
      value: String(overdueInvoices.length),
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      sub: overdueInvoices.length > 0 ? 'Requires immediate attention' : 'All current',
      isCount: true,
    },
    {
      label: 'Overdue Bills',
      value: String(overdueBills.length),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      sub: overdueBills.length > 0 ? 'Payment overdue' : 'All current',
      isCount: true,
    },
    {
      label: 'Transactions (Period)',
      value: String(transactions.length),
      icon: BookOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      isCount: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse">
            <div className="h-3 bg-slate-200 rounded w-24 mb-3" />
            <div className="h-7 bg-slate-200 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Accounts Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bookkeeping dashboard — debits, credits, receivables & payables
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
          <BarChart3 className="w-3.5 h-3.5" />
          Current Period
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-white rounded-2xl border ${card.border} p-5 shadow-xs hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 leading-snug max-w-[120px]">
                  {card.label}
                </p>
                <div className={`${card.bg} ${card.color} p-1.5 rounded-lg`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className={`${card.isCount ? 'text-3xl' : 'text-xl'} font-extrabold text-slate-900 tracking-tight`}>
                {card.value}
              </p>
              {card.sub && (
                <p className="text-[11px] text-slate-400 font-medium mt-1">{card.sub}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Invoice & Bill Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Invoice Status</h3>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Draft', statuses: ['DRAFT'], color: 'bg-slate-200 text-slate-600' },
              { label: 'Sent / Unpaid', statuses: ['SENT', 'UNPAID'], color: 'bg-blue-100 text-blue-700' },
              { label: 'Partially Paid', statuses: ['PARTIALLY_PAID'], color: 'bg-amber-100 text-amber-700' },
              { label: 'Paid', statuses: ['PAID'], color: 'bg-emerald-100 text-emerald-700' },
              { label: 'Overdue', statuses: ['OVERDUE'], color: 'bg-rose-100 text-rose-700' },
            ].map(({ label, statuses, color }) => {
              const count = invoices.filter((inv: any) => statuses.includes(inv.status)).length;
              return (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">{label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${color}`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Bill Status</h3>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Draft', statuses: ['DRAFT'], color: 'bg-slate-200 text-slate-600' },
              { label: 'Pending', statuses: ['PENDING'], color: 'bg-blue-100 text-blue-700' },
              { label: 'Approved', statuses: ['APPROVED'], color: 'bg-purple-100 text-purple-700' },
              { label: 'Partially Paid', statuses: ['PARTIALLY_PAID'], color: 'bg-amber-100 text-amber-700' },
              { label: 'Paid', statuses: ['PAID'], color: 'bg-emerald-100 text-emerald-700' },
              { label: 'Overdue', statuses: ['OVERDUE'], color: 'bg-rose-100 text-rose-700' },
            ].map(({ label, statuses, color }) => {
              const count = bills.filter((bill: any) => statuses.includes(bill.status)).length;
              return (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">{label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${color}`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Transactions', href: '/dashboard/accounts/transactions', icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
            { label: 'Create Invoice', href: '/dashboard/accounts/invoices', icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Record Bill', href: '/dashboard/accounts/bills', icon: Receipt, color: 'text-amber-600 bg-amber-50' },
            { label: 'Journal Entry', href: '/dashboard/accounts/journal-entries', icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
            { label: 'General Ledger', href: '/dashboard/accounts/general-ledger', icon: BarChart3, color: 'text-slate-600 bg-slate-50' },
            { label: 'Bank & Accounts', href: '/dashboard/accounts/bank-accounts', icon: Landmark, color: 'text-sky-600 bg-sky-50' },
            { label: 'Bank Reconciliation', href: '/dashboard/accounts/bank-reconciliation', icon: RefreshCw, color: 'text-indigo-600 bg-indigo-50' },
          ].map(({ label, href, icon: Icon, color }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-xs transition-all group"
            >
              <div className={`${color} p-1.5 rounded-lg`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
