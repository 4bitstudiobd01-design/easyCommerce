'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Receipt,
  Search,
  Printer,
  Download,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Scale,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  useGetChartOfAccountsQuery,
  useGetGeneralLedgerQuery,
} from '../api/financeApi';

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function GeneralLedgerView() {
  const searchParams = useSearchParams();
  const initialAccountId = searchParams.get('accountId') || '';

  const { data: coaData } = useGetChartOfAccountsQuery();
  const accounts = coaData?.accounts || [];

  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      // Default to first Cash or Bank account (1010 or 1020)
      const defaultAcc = accounts.find((a) => a.code === '1010' || a.code === '1020') || accounts[0];
      setSelectedAccountId(defaultAcc.id);
    }
  }, [accounts, selectedAccountId]);

  const { data: ledgerData, isLoading } = useGetGeneralLedgerQuery(
    {
      accountId: selectedAccountId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
    { skip: !selectedAccountId },
  );

  const account = ledgerData?.account;
  const transactions = ledgerData?.transactions || [];

  const total = transactions.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, total);
  const paginatedTransactions = transactions.slice((page - 1) * limit, page * limit);

  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">General Ledger</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Individual account journal audit, debits, credits, and running balance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Ledger
          </button>
        </div>
      </div>

      {/* Account Selector & Filters Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex-1 max-w-md">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Account to Inspect</label>
          <select
            value={selectedAccountId}
            onChange={(e) => {
              setSelectedAccountId(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-teal-500 outline-hidden cursor-pointer"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.code} — {acc.name} ({acc.accountClass})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Account Summary Cards */}
      {ledgerData && account && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Opening Balance</span>
            <p className="text-xl font-black text-slate-900 mt-1">{formatMoney(ledgerData.openingBalance)}</p>
            <span className="text-[10px] text-slate-500">Before period start</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Period Debits (Dr)</span>
            <p className="text-xl font-black text-blue-700 mt-1">{formatMoney(ledgerData.periodDebits)}</p>
            <span className="text-[10px] text-blue-600 font-semibold">Total debited</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Period Credits (Cr)</span>
            <p className="text-xl font-black text-purple-700 mt-1">{formatMoney(ledgerData.periodCredits)}</p>
            <span className="text-[10px] text-purple-600 font-semibold">Total credited</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-teal-200 bg-teal-50/30 shadow-xs">
            <span className="text-[11px] font-bold uppercase text-teal-800 tracking-wider">Closing Balance</span>
            <p className="text-xl font-black text-teal-900 mt-1">{formatMoney(ledgerData.closingBalance)}</p>
            <span className="text-[10px] text-teal-700 font-bold">
              {account.normalBalance === 'DEBIT' ? 'Normal: Debit' : 'Normal: Credit'}
            </span>
          </div>
        </div>
      )}

      {/* Ledger Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Account Ledger: {account?.code} — {account?.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Classification: {account?.accountClass} | Currency: {account?.currency || 'BDT'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">JE Number</th>
                <th className="py-3.5 px-6">Description & Memo</th>
                <th className="py-3.5 px-6">Party</th>
                <th className="py-3.5 px-6 text-right">Debit (Dr)</th>
                <th className="py-3.5 px-6 text-right">Credit (Cr)</th>
                <th className="py-3.5 px-6 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading account ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No transactions recorded for this account in the selected date range.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 whitespace-nowrap text-slate-600 font-semibold">{tx.entryDate}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">{tx.entryNumber}</td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-slate-900">{tx.description}</span>
                      {tx.sourceReference && (
                        <span className="ml-2 font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {tx.sourceReference}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">{tx.partyName || '-'}</td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-blue-700">
                      {tx.debit > 0 ? formatMoney(tx.debit) : '-'}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-purple-700">
                      {tx.credit > 0 ? formatMoney(tx.credit) : '-'}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-black text-slate-900">
                      {formatMoney(tx.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination Toolbar */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-600">
              Showing <span className="font-bold text-slate-900">{startEntry}</span> to{' '}
              <span className="font-bold text-slate-900">{endEntry}</span> of{' '}
              <span className="font-bold text-slate-900">{total}</span> ledger entries
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-[11px] text-slate-400">Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1 mx-1">
              {getPaginationNumbers().map((num, idx) => {
                if (num === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 font-bold">
                      ...
                    </span>
                  );
                }
                const pageNum = Number(num);
                const isCurrent = pageNum === page;
                return (
                  <button
                    key={`gl-page-${pageNum}`}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isCurrent
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-white transition cursor-pointer text-slate-700"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
