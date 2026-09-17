'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Send,
  Ban,
} from 'lucide-react';
import {
  useGetJournalEntriesQuery,
  useGetJournalEntryStatsQuery,
  useGetAccountsQuery,
  useCreateJournalEntryMutation,
  usePostJournalEntryMutation,
  useVoidJournalEntryMutation,
  JournalEntry,
  JournalStatus,
} from '../api/accountingApi';

type StatusFilterLabel = 'All Status' | 'Posted' | 'Draft';

const STATUS_FILTER_MAP: Record<StatusFilterLabel, JournalStatus | undefined> = {
  'All Status': undefined,
  Posted: 'POSTED',
  Draft: 'DRAFT',
};

const PAGE_SIZE_MAP: Record<string, number> = {
  '10 per page': 10,
  '20 per page': 20,
  '50 per page': 50,
};

function formatCurrency(value: string | number | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value ?? 0;
  if (Number.isNaN(n)) return '৳0.00';
  return `৳${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAmount(value: string | number | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value ?? 0;
  if (Number.isNaN(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function statusBadge(status: JournalStatus): { label: string; className: string } {
  switch (status) {
    case 'POSTED':
      return { label: 'Posted', className: 'bg-emerald-50 text-emerald-600' };
    case 'DRAFT':
      return { label: 'Draft', className: 'bg-amber-50 text-amber-600' };
    default:
      return { label: 'Void', className: 'bg-rose-50 text-rose-600' };
  }
}

function accountSummary(entry: JournalEntry): string {
  const lines = [...(entry.lines ?? [])].sort((a, b) => a.lineOrder - b.lineOrder);
  if (lines.length === 0) return '—';
  return lines.length > 1 ? `${lines[0].accountName} …` : lines[0].accountName;
}

interface DraftLine {
  key: string;
  accountId: string;
  debit: string;
  credit: string;
}

let lineKeySeed = 0;
const newLine = (): DraftLine => ({
  key: `line-${lineKeySeed++}`,
  accountId: '',
  debit: '',
  credit: '',
});

const todayIso = () => new Date().toISOString().slice(0, 10);

export function JournalEntriesView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterLabel>('All Status');
  const [accountFilter, setAccountFilter] = useState('');
  const [dateRange] = useState('This Month');
  const [pageSize, setPageSize] = useState('10 per page');
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [voidingEntry, setVoidingEntry] = useState<JournalEntry | null>(null);

  const limit = PAGE_SIZE_MAP[pageSize] ?? 10;

  const { data: stats } = useGetJournalEntryStatsQuery();
  const { data: accountsData } = useGetAccountsQuery({ activeOnly: true });
  const accounts = accountsData ?? [];

  const {
    data: entriesData,
    isLoading,
    isFetching,
  } = useGetJournalEntriesQuery({
    search: searchTerm.trim() || undefined,
    status: STATUS_FILTER_MAP[statusFilter],
    accountId: accountFilter || undefined,
    page: currentPage,
    limit,
  });

  const entries = entriesData?.items ?? [];
  const total = entriesData?.total ?? 0;
  const page = entriesData?.page ?? currentPage;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  const [createJournalEntry, { isLoading: isCreating }] = useCreateJournalEntryMutation();
  const [postJournalEntry, { isLoading: isPosting }] = usePostJournalEntryMutation();
  const [voidJournalEntry, { isLoading: isVoiding }] = useVoidJournalEntryMutation();

  // ── New entry modal state ──────────────────────────────────────
  const [formDate, setFormDate] = useState(todayIso);
  const [formReference, setFormReference] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLines, setFormLines] = useState<DraftLine[]>(() => [newLine(), newLine()]);

  const resetForm = () => {
    setFormDate(todayIso());
    setFormReference('');
    setFormDescription('');
    lineKeySeed = 0;
    setFormLines([newLine(), newLine()]);
  };

  const openModal = () => {
    resetForm();
    setIsNewModalOpen(true);
  };

  const closeModal = () => {
    setIsNewModalOpen(false);
  };

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setFormLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const addLine = () => setFormLines((prev) => [...prev, newLine()]);
  const removeLine = (key: string) =>
    setFormLines((prev) => (prev.length <= 2 ? prev : prev.filter((l) => l.key !== key)));

  const totalDebit = useMemo(
    () => formLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0),
    [formLines],
  );
  const totalCredit = useMemo(
    () => formLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0),
    [formLines],
  );
  const balanced = Math.round(totalDebit * 100) === Math.round(totalCredit * 100);
  const usableLines = formLines.filter(
    (l) => l.accountId && ((Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0),
  );
  const canSave =
    formDate.trim() !== '' &&
    formDescription.trim() !== '' &&
    usableLines.length >= 2 &&
    balanced &&
    totalDebit > 0;

  const buildLinesPayload = () =>
    usableLines.map((l) => ({
      accountId: l.accountId,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
    }));

  const submitEntry = async (status: 'POSTED' | 'DRAFT') => {
    if (!canSave) return;
    try {
      await createJournalEntry({
        date: formDate,
        description: formDescription.trim(),
        reference: formReference.trim() || undefined,
        status,
        lines: buildLinesPayload(),
      }).unwrap();
      toast.success(status === 'POSTED' ? 'Journal entry posted.' : 'Draft saved.');
      setIsNewModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to save journal entry.');
    }
  };

  const handlePost = async (entry: JournalEntry) => {
    try {
      await postJournalEntry(entry.id).unwrap();
      toast.success(`${entry.entryNumber} posted.`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to post entry.');
    }
  };

  const handleVoidConfirm = async () => {
    if (!voidingEntry) return;
    try {
      await voidJournalEntry(voidingEntry.id).unwrap();
      toast.success(`${voidingEntry.entryNumber} voided.`);
      setVoidingEntry(null);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to void entry.');
    }
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Journal Entries</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and view all journal entries.</p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={openModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Entries */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Total Entries</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {stats?.totalEntries ?? 0}
              </div>
              <div className="text-[11px] font-normal text-slate-400 mt-1">This Month</div>
            </div>
          </div>
        </div>

        {/* Card 2: Posted Entries */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Posted Entries</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {stats?.postedEntries ?? 0}
              </div>
              <div className="text-[11px] font-normal text-slate-400 mt-1">This Month</div>
            </div>
          </div>
        </div>

        {/* Card 3: Draft Entries */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Draft Entries</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {stats?.draftEntries ?? 0}
              </div>
              <div className="text-[11px] font-normal text-slate-400 mt-1">This Month</div>
            </div>
          </div>
        </div>

        {/* Card 4: Total Amount */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold">৳</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Total Amount</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {formatCurrency(stats?.totalAmount)}
              </div>
              <div className="text-[11px] font-normal text-slate-400 mt-1">This Month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card with Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by reference, description or account"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* Right Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Picker */}
            <button
              type="button"
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilterLabel);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer transition"
              >
                <option>All Status</option>
                <option>Posted</option>
                <option>Draft</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Account Dropdown */}
            <div className="relative">
              <select
                value={accountFilter}
                onChange={(e) => {
                  setAccountFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer transition"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} — {account.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filters Button */}
            <button
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Entries Table */}
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
                <th className="px-6 py-3.5 font-bold">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600">
                    <span>REFERENCE</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-300" />
                  </div>
                </th>
                <th className="px-6 py-3.5 font-bold">DESCRIPTION</th>
                <th className="px-6 py-3.5 font-bold">ACCOUNT</th>
                <th className="px-6 py-3.5 font-bold">DEBIT (৳)</th>
                <th className="px-6 py-3.5 font-bold">CREDIT (৳)</th>
                <th className="px-6 py-3.5 font-bold">STATUS</th>
                <th className="px-6 py-3.5 font-bold text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="border-b border-slate-100">
                    {Array.from({ length: 8 }).map((__, cidx) => (
                      <td key={cidx} className="px-6 py-4">
                        <div className="animate-pulse bg-slate-200/80 rounded-lg h-4 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No journal entries found.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click &quot;New Journal Entry&quot; to record one.
                    </p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const badge = statusBadge(entry.status);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 text-slate-900 font-medium whitespace-nowrap">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                        >
                          {entry.entryNumber}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {accountSummary(entry)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        {formatAmount(entry.totalDebit)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        {formatAmount(entry.totalCredit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {entry.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => handlePost(entry)}
                              disabled={isPosting}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold transition disabled:opacity-50"
                              title="Post entry"
                            >
                              <Send className="w-3.5 h-3.5" /> Post
                            </button>
                          )}
                          {(entry.status === 'POSTED' || entry.status === 'DRAFT') && (
                            <button
                              type="button"
                              onClick={() => setVoidingEntry(entry)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold transition"
                              title="Void entry"
                            >
                              <Ban className="w-3.5 h-3.5" /> Void
                            </button>
                          )}
                          {entry.status === 'VOID' && (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            {isFetching && !isLoading
              ? 'Loading…'
              : `Showing ${rangeStart} to ${rangeEnd} of ${total} entries`}
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size Selector */}
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option>10 per page</option>
                <option>20 per page</option>
                <option>50 per page</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Pagination Numbers */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
                disabled={page <= 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-slate-700 font-bold">
                {page} <span className="text-slate-400 font-medium">/ {totalPages}</span>
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Journal Entry Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Journal Entry</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record double-entry debit and credit lines
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reference No</label>
                <input
                  type="text"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  placeholder="Optional external reference"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Description / Narration
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter journal description..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            {/* Entry lines */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Lines
                </span>
                <button
                  type="button"
                  onClick={addLine}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-[11px] rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add line
                </button>
              </div>
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-xl">
                <div className="col-span-5">Account</div>
                <div className="col-span-3">Debit (৳)</div>
                <div className="col-span-3">Credit (৳)</div>
                <div className="col-span-1" />
              </div>
              {formLines.map((line) => (
                <div key={line.key} className="grid grid-cols-12 gap-2 text-xs items-center">
                  <div className="col-span-5">
                    <select
                      value={line.accountId}
                      onChange={(e) => updateLine(line.key, { accountId: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="">Select account…</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} — {account.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.debit}
                      onChange={(e) =>
                        updateLine(line.key, {
                          debit: e.target.value,
                          credit: e.target.value ? '' : line.credit,
                        })
                      }
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.credit}
                      onChange={(e) =>
                        updateLine(line.key, {
                          credit: e.target.value,
                          debit: e.target.value ? '' : line.debit,
                        })
                      }
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      disabled={formLines.length <= 2}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      title="Remove line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Running totals */}
              <div className="grid grid-cols-12 gap-2 text-xs font-bold bg-slate-50 p-2 rounded-xl">
                <div className="col-span-5 text-slate-600 uppercase tracking-wider">Totals</div>
                <div
                  className={`col-span-3 ${balanced ? 'text-slate-900' : 'text-rose-600'}`}
                >
                  {formatAmount(totalDebit)}
                </div>
                <div
                  className={`col-span-3 ${balanced ? 'text-slate-900' : 'text-rose-600'}`}
                >
                  {formatAmount(totalCredit)}
                </div>
                <div className="col-span-1" />
              </div>
              {!balanced && (
                <p className="text-[11px] text-rose-600 font-medium">
                  Debits and credits must be equal.
                </p>
              )}
              {balanced && usableLines.length < 2 && (
                <p className="text-[11px] text-amber-600 font-medium">
                  Add at least two lines with an account and an amount.
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submitEntry('DRAFT')}
                disabled={!canSave || isCreating}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => submitEntry('POSTED')}
                disabled={!canSave || isCreating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Saving…' : 'Save as Posted'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void confirmation modal */}
      {voidingEntry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Void Journal Entry?</h3>
            </div>
            <p className="text-sm text-slate-600">
              <strong>{voidingEntry.entryNumber}</strong> will be marked as void and excluded
              from the ledger and reports. It stays on record for audit.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVoidingEntry(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVoidConfirm}
                disabled={isVoiding}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
              >
                {isVoiding ? 'Voiding…' : 'Yes, Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
