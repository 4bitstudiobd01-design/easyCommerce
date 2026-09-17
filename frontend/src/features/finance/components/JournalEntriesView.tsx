'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  User,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  useGetJournalEntriesQuery,
  FinanceJournalEntry,
} from '../api/financeApi';
import { CreateJournalEntryModal } from './CreateJournalEntryModal';

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SOURCE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  MANUAL: { label: 'Manual Journal', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
  ORDER: { label: 'E-Commerce Order', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  REFUND: { label: 'Order Refund', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
  INVOICE: { label: 'Customer Invoice', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  BILL: { label: 'Supplier Bill', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  PAYROLL: { label: 'HRM Payroll', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  HR_EXPENSE: { label: 'Staff Reimbursement', bg: 'bg-violet-50 border-violet-200', text: 'text-violet-700' },
  TRANSFER: { label: 'Bank Transfer', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
  INVENTORY_ADJUSTMENT: { label: 'Stock Valuation', bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-700' },
  PERIOD_CLOSING: { label: 'Period Closing', bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700' },
};

export function JournalEntriesView() {
  const [sourceType, setSourceType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useGetJournalEntriesQuery({
    sourceType: sourceType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: search.trim() || undefined,
    page,
    limit: 20,
  });

  const entries = data?.items || [];
  const summary = data?.summary;
  const totalPages = data?.totalPages || 1;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Journal Entries</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Double-entry accounting transaction ledger with automatic cross-module posting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-indigo-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            New Journal Entry
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search JE number, reference, memo..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-hidden transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-hidden"
          >
            <option value="">All Source Modules</option>
            <option value="MANUAL">Manual Journal</option>
            <option value="ORDER">E-Commerce Orders</option>
            <option value="REFUND">Order Refunds</option>
            <option value="INVOICE">Customer Invoices</option>
            <option value="BILL">Supplier Bills</option>
            <option value="PAYROLL">HRM Payroll</option>
            <option value="TRANSFER">Account Transfers</option>
            <option value="INVENTORY_ADJUSTMENT">Inventory Adjustments</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
          />
        </div>
      </div>

      {/* Journal Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="w-8 py-3.5 px-4"></th>
                <th className="py-3.5 px-4">Entry Number</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Source Module</th>
                <th className="py-3.5 px-6">Description & Memo</th>
                <th className="py-3.5 px-4 text-right">Debit</th>
                <th className="py-3.5 px-4 text-right">Credit</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading journal ledger...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No journal entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const source = SOURCE_BADGES[entry.sourceType] || {
                    label: entry.sourceType,
                    bg: 'bg-slate-50 border-slate-200',
                    text: 'text-slate-700',
                  };

                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        onClick={() => toggleExpand(entry.id)}
                        className="hover:bg-slate-50/70 transition cursor-pointer"
                      >
                        <td className="py-4 px-4 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-mono font-black text-slate-900">{entry.entryNumber}</span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-semibold">
                          {entry.entryDate}
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${source.bg} ${source.text}`}
                          >
                            {source.label}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div>
                            <span className="font-bold text-slate-900">{entry.description}</span>
                            {entry.sourceReference && (
                              <span className="ml-2 font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                {entry.sourceReference}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-bold text-blue-700">
                          {formatMoney(entry.totalDebit)}
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-bold text-purple-700">
                          {formatMoney(entry.totalCredit)}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            {entry.status}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable lines row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={8} className="p-4 pl-12">
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                                  Journal Lines Breakdown
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  Posted: {new Date(entry.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400">
                                      <th className="py-2 px-3">Account Code & Name</th>
                                      <th className="py-2 px-3">Line Memo</th>
                                      <th className="py-2 px-3">Party / Contact</th>
                                      <th className="py-2 px-3 text-right">Debit (Dr)</th>
                                      <th className="py-2 px-3 text-right">Credit (Cr)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {(entry.lines || []).map((line) => {
                                      const isDr = line.type === 'DEBIT';
                                      return (
                                        <tr key={line.id} className="hover:bg-slate-50/50">
                                          <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-2">
                                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                                {line.accountCode}
                                              </span>
                                              <span className="font-semibold text-slate-800">{line.accountName}</span>
                                            </div>
                                          </td>

                                          <td className="py-2.5 px-3 text-slate-600">
                                            {line.description || '-'}
                                          </td>

                                          <td className="py-2.5 px-3 text-slate-600">
                                            {line.partyName ? (
                                              <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                                <User className="w-3 h-3 text-slate-400" />
                                                {line.partyName}
                                              </span>
                                            ) : (
                                              '-'
                                            )}
                                          </td>

                                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                                            {isDr ? formatMoney(line.amount) : '-'}
                                          </td>

                                          <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                                            {!isDr ? formatMoney(line.amount) : '-'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold disabled:opacity-30"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateJournalEntryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
