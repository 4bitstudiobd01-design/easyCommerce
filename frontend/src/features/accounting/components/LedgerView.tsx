'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  Download,
  FileText,
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  ArrowUpDown,
  X,
  Printer,
} from 'lucide-react';
import {
  useGetAccountsQuery,
  useGetAccountLedgerQuery,
} from '../api/accountingApi';

/** "1520.00" → "৳1,520.00" */
function formatCurrency(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return '৳0.00';
  return `৳${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "25000.00" → "25,000.00", "0.00" → "-" */
function formatAmountCell(value: string): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n) || n === 0) return '-';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "2024-05-31" → "May 31, 2024" */
function formatDate(value: string): string {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function currentMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

export function LedgerView() {
  const { data: accounts = [], isLoading: isLoadingAccounts } = useGetAccountsQuery({
    activeOnly: true,
  });

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [fromDate, setFromDate] = useState(currentMonthStart());
  const [toDate, setToDate] = useState(today());
  const [transactionType, setTransactionType] = useState('All');
  const [referenceType, setReferenceType] = useState('All');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const { data: ledger, isLoading: isLoadingLedger, isFetching: isFetchingLedger } =
    useGetAccountLedgerQuery(
      { accountId: selectedAccountId, from: fromDate, to: toDate },
      { skip: !selectedAccountId },
    );

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const accountLabel = selectedAccount
    ? `${selectedAccount.name} (${selectedAccount.code})`
    : 'Select an account';

  const dateRangeLabel = `${formatDate(fromDate)} - ${formatDate(toDate)}`;

  const rows = ledger?.rows ?? [];
  const showLoading = isLoadingLedger || isFetchingLedger;

  const netMovement =
    ledger != null
      ? Number(ledger.closingBalance) - Number(ledger.openingBalance)
      : 0;
  const netMovementLabel = `${netMovement >= 0 ? '+' : '-'}${formatCurrency(
    Math.abs(netMovement),
  )}`;

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">View account balances and transactions.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto relative">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 text-xs font-medium text-slate-700">
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen(false)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen(false)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export as Excel / CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* Account Statement Button */}
          <button
            type="button"
            onClick={() => setIsStatementModalOpen(true)}
            disabled={!selectedAccount}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>Account Statement</span>
          </button>
        </div>
      </div>

      {/* Account Balance Summary Banner Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Account Title & Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{accountLabel}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedAccount?.description || 'Account ledger'}
              </p>
            </div>
          </div>

          {/* Balance Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-10 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            {/* Opening Balance */}
            <div>
              <span className="text-xs font-medium text-slate-400 block">Opening Balance</span>
              <div className="text-sm font-bold text-slate-900 mt-1 font-mono">
                {formatCurrency(ledger?.openingBalance)}
              </div>
            </div>

            {/* Total Debit */}
            <div>
              <span className="text-xs font-medium text-slate-400 block">Total Debit</span>
              <div className="text-sm font-bold text-emerald-600 mt-1 font-mono">
                {formatCurrency(ledger?.totalDebit)}
              </div>
            </div>

            {/* Total Credit */}
            <div>
              <span className="text-xs font-medium text-slate-400 block">Total Credit</span>
              <div className="text-sm font-bold text-rose-500 mt-1 font-mono">
                {formatCurrency(ledger?.totalCredit)}
              </div>
            </div>

            {/* Closing Balance */}
            <div>
              <span className="text-xs font-medium text-slate-400 block">Closing Balance</span>
              <div className="text-base font-extrabold text-slate-900 mt-1 font-mono tracking-tight">
                {formatCurrency(ledger?.closingBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card with Selectors & Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Filters & Selectors Bar */}
        <div className="p-5 border-b border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
            {/* Account Selector (3 cols) */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Account
              </label>
              <div className="relative">
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  disabled={isLoadingAccounts || accounts.length === 0}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                >
                  {accounts.length === 0 && <option value="">Select an account</option>}
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} — {acc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Date Range Picker (3 cols) */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <span className="text-xs text-slate-400">–</span>
                <div className="relative flex-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-2 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Transaction Type (2 cols) */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Transaction Type
              </label>
              <div className="relative">
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option>All</option>
                  <option>Journal Entry</option>
                  <option>Invoice</option>
                  <option>Payment</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Reference Type (2 cols) */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Reference Type
              </label>
              <div className="relative">
                <select
                  value={referenceType}
                  onChange={(e) => setReferenceType(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option>All</option>
                  <option>Order</option>
                  <option>Expense</option>
                  <option>Manual JE</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Filters Button (2 cols) */}
            <div className="lg:col-span-2">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5 font-bold">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600">
                    <span>DATE</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-300" />
                  </div>
                </th>
                <th className="px-6 py-3.5 font-bold">REFERENCE</th>
                <th className="px-6 py-3.5 font-bold">DESCRIPTION</th>
                <th className="px-6 py-3.5 font-bold">DEBIT (৳)</th>
                <th className="px-6 py-3.5 font-bold">CREDIT (৳)</th>
                <th className="px-6 py-3.5 font-bold">BALANCE (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[12px]">
              {!selectedAccountId ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center font-sans">
                    <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">Select an account</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose an account above to view its ledger.
                    </p>
                  </td>
                </tr>
              ) : showLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-3">
                      <div className="h-6 rounded-lg bg-slate-100 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {/* Opening Balance Row */}
                  <tr className="bg-slate-50/70">
                    <td className="px-6 py-4 text-slate-900 font-sans font-semibold whitespace-nowrap">
                      {formatDate(fromDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-sans">—</td>
                    <td className="px-6 py-4 font-sans font-bold text-slate-900 whitespace-nowrap">
                      Opening Balance
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-400 whitespace-nowrap">-</td>
                    <td className="px-6 py-4 font-semibold text-slate-400 whitespace-nowrap">-</td>
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatAmountCell(ledger?.openingBalance ?? '0')}
                    </td>
                  </tr>

                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center font-sans">
                        <p className="font-semibold text-slate-700">
                          No transactions in this period
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Try widening the date range.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <tr key={`${row.entryId}-${idx}`} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 text-slate-900 font-sans font-medium whitespace-nowrap">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-blue-600 font-semibold">{row.entryNumber}</span>
                        </td>
                        <td className="px-6 py-4 font-sans text-slate-900 whitespace-nowrap">
                          <span className="font-semibold">{row.description}</span>
                          {row.memo && (
                            <span className="block text-[11px] text-slate-400 font-normal">
                              {row.memo}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                          {formatAmountCell(row.debit)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-400 whitespace-nowrap">
                          {formatAmountCell(row.credit)}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                          {formatAmountCell(row.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Closing Balance Row */}
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td className="px-6 py-4 text-slate-900 font-sans font-semibold whitespace-nowrap">
                      {formatDate(toDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-sans">—</td>
                    <td className="px-6 py-4 font-sans font-bold text-slate-900 whitespace-nowrap">
                      Closing Balance
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatAmountCell(ledger?.totalDebit ?? '0')}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatAmountCell(ledger?.totalCredit ?? '0')}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 whitespace-nowrap">
                      {formatAmountCell(ledger?.closingBalance ?? '0')}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500 font-sans">
          <div>
            {selectedAccountId && !showLoading
              ? `Showing ${rows.length} transaction${rows.length === 1 ? '' : 's'} for ${dateRangeLabel}`
              : ''}
          </div>
        </div>
      </div>

      {/* Account Statement Modal */}
      {isStatementModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Account Statement</h3>
                <p className="text-xs text-slate-500 mt-0.5">Generate official printable account statement</p>
              </div>
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Account:</span>
                <span className="font-bold text-slate-900">{accountLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statement Period:</span>
                <span className="font-medium text-slate-700">{dateRangeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Net Movement:</span>
                <span
                  className={`font-bold ${netMovement >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}
                >
                  {netMovementLabel}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2">
                <span className="font-bold text-slate-900">Closing Balance:</span>
                <span className="font-extrabold text-blue-600">
                  {formatCurrency(ledger?.closingBalance)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
