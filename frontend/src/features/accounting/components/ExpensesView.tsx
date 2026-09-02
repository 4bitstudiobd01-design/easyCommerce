'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Wallet,
  ArrowDownCircle,
  Clock,
  BarChart3,
  Plus,
  Search,
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  ArrowUpDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Building2,
  Banknote,
  Landmark,
  Smartphone,
  X,
  Upload,
  Trash2,
  Pencil,
} from 'lucide-react';
import {
  useGetExpensesQuery,
  useGetExpenseStatsQuery,
  useGetAccountsQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  Expense,
  ExpensePaymentMethod,
  ExpenseStatus,
} from '../api/accountingApi';

// ─── Static option maps ──────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  'Marketing',
  'Shipping',
  'Office',
  'Utilities',
  'Meals',
  'Packaging',
  'Subscription',
] as const;

type MethodFilterLabel =
  | 'All Payment Methods'
  | 'Cash'
  | 'Bank Transfer'
  | 'Card'
  | 'Cheque'
  | 'Mobile Banking';

const METHOD_FILTER_MAP: Record<MethodFilterLabel, ExpensePaymentMethod | undefined> = {
  'All Payment Methods': undefined,
  Cash: 'CASH',
  'Bank Transfer': 'BANK_TRANSFER',
  Card: 'CARD',
  Cheque: 'CHEQUE',
  'Mobile Banking': 'MOBILE_BANKING',
};

type StatusFilterLabel = 'All Status' | 'Paid' | 'Due';

const STATUS_FILTER_MAP: Record<StatusFilterLabel, ExpenseStatus | undefined> = {
  'All Status': undefined,
  Paid: 'PAID',
  Due: 'DUE',
};

const METHOD_SELECT_OPTIONS: Array<{ label: string; value: ExpensePaymentMethod }> = [
  { label: 'Cash', value: 'CASH' },
  { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
  { label: 'Card', value: 'CARD' },
  { label: 'Cheque', value: 'CHEQUE' },
  { label: 'Mobile Banking', value: 'MOBILE_BANKING' },
];

const METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CARD: 'Card',
  CHEQUE: 'Cheque',
  MOBILE_BANKING: 'Mobile Banking',
};

const PAGE_SIZE_MAP: Record<string, number> = {
  '10 per page': 10,
  '20 per page': 20,
  '50 per page': 50,
};

const CATEGORY_DOT_PALETTE = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-teal-500',
];

// ─── Formatting helpers ──────────────────────────────────────────────────────

function categoryDotColor(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_DOT_PALETTE[hash % CATEGORY_DOT_PALETTE.length];
}

function formatCurrency(value: string | number | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value ?? 0;
  if (Number.isNaN(n)) return '৳0';
  return `৳${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatAmount(value: string | number | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value ?? 0;
  if (Number.isNaN(n)) return '৳0.00';
  return `৳${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function renderMethodIcon(method: ExpensePaymentMethod) {
  switch (method) {
    case 'CARD':
      return <CreditCard className="w-3.5 h-3.5 text-slate-500" />;
    case 'BANK_TRANSFER':
      return <Building2 className="w-3.5 h-3.5 text-slate-500" />;
    case 'CASH':
      return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
    case 'CHEQUE':
      return <Landmark className="w-3.5 h-3.5 text-slate-500" />;
    case 'MOBILE_BANKING':
      return <Smartphone className="w-3.5 h-3.5 text-slate-500" />;
    default:
      return null;
  }
}

const todayIso = () => new Date().toISOString().slice(0, 10);

interface ExpenseFormState {
  title: string;
  category: string;
  vendor: string;
  amount: string;
  note: string;
  paymentMethod: ExpensePaymentMethod;
  date: string;
  status: ExpenseStatus;
  expenseAccountId: string;
  paidFromAccountId: string;
}

const emptyForm = (): ExpenseFormState => ({
  title: '',
  category: CATEGORY_OPTIONS[0],
  vendor: '',
  amount: '',
  note: '',
  paymentMethod: 'CASH',
  date: todayIso(),
  status: 'PAID',
  expenseAccountId: '',
  paidFromAccountId: '',
});

export function ExpensesView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [methodFilter, setMethodFilter] = useState<MethodFilterLabel>('All Payment Methods');
  const [statusFilter, setStatusFilter] = useState<StatusFilterLabel>('All Status');
  const [dateRange] = useState('This Month');
  const [pageSize, setPageSize] = useState('10 per page');
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const limit = PAGE_SIZE_MAP[pageSize] ?? 10;

  const { data: stats } = useGetExpenseStatsQuery();
  const { data: accountsData } = useGetAccountsQuery({ activeOnly: true });
  const accounts = accountsData ?? [];
  const expenseAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'EXPENSE'),
    [accounts],
  );
  const assetAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'ASSET'),
    [accounts],
  );

  const {
    data: expensesData,
    isLoading,
    isFetching,
  } = useGetExpensesQuery({
    search: searchTerm.trim() || undefined,
    category: categoryFilter === 'All Categories' ? undefined : categoryFilter,
    paymentMethod: METHOD_FILTER_MAP[methodFilter],
    status: STATUS_FILTER_MAP[statusFilter],
    page: currentPage,
    limit,
  });

  const expenses = expensesData?.items ?? [];
  const total = expensesData?.total ?? 0;
  const page = expensesData?.page ?? currentPage;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(CATEGORY_OPTIONS as readonly string[]);
    expenses.forEach((e) => set.add(e.category));
    return Array.from(set).sort();
  }, [expenses]);

  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  // ── New expense form ─────────────────────────────────────────
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);
  const patchForm = (patch: Partial<ExpenseFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const openNewModal = () => {
    setForm(emptyForm());
    setIsNewModalOpen(true);
  };

  const amountValue = Number(form.amount);
  const canSaveNew =
    form.title.trim() !== '' &&
    form.category.trim() !== '' &&
    form.date.trim() !== '' &&
    !Number.isNaN(amountValue) &&
    amountValue > 0 &&
    form.expenseAccountId !== '' &&
    (form.status === 'DUE' || form.paidFromAccountId !== '');

  const submitNew = async () => {
    if (!canSaveNew) {
      toast.error('Fill in a title, category, date, positive amount and expense account.');
      return;
    }
    try {
      await createExpense({
        date: form.date,
        title: form.title.trim(),
        note: form.note.trim() || undefined,
        category: form.category.trim(),
        vendor: form.vendor.trim() || undefined,
        amount: Number(amountValue.toFixed(2)),
        paymentMethod: form.paymentMethod,
        status: form.status,
        expenseAccountId: form.expenseAccountId,
        paidFromAccountId:
          form.status === 'PAID' ? form.paidFromAccountId || undefined : undefined,
      }).unwrap();
      toast.success('Expense recorded.');
      setIsNewModalOpen(false);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? 'Failed to record expense.';
      toast.error(message);
    }
  };

  // ── Metadata edit form ───────────────────────────────────────
  const [editForm, setEditForm] = useState({ title: '', category: '', vendor: '', note: '' });
  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setEditForm({
      title: expense.title,
      category: expense.category,
      vendor: expense.vendor ?? '',
      note: expense.note ?? '',
    });
    setOpenMenuId(null);
  };

  const submitEdit = async () => {
    if (!editingExpense) return;
    if (editForm.title.trim() === '' || editForm.category.trim() === '') {
      toast.error('Title and category are required.');
      return;
    }
    try {
      await updateExpense({
        id: editingExpense.id,
        title: editForm.title.trim(),
        category: editForm.category.trim(),
        vendor: editForm.vendor.trim() || undefined,
        note: editForm.note.trim() || undefined,
      }).unwrap();
      toast.success('Expense updated.');
      setEditingExpense(null);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? 'Failed to update expense.';
      toast.error(message);
    }
  };

  const confirmDelete = async () => {
    if (!deletingExpense) return;
    try {
      const res = await deleteExpense(deletingExpense.id).unwrap();
      toast.success(res.message ?? 'Expense deleted.');
      setDeletingExpense(null);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? 'Failed to delete expense.';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 w-full pb-10" onClick={() => setOpenMenuId(null)}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage all business expenses.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import Expenses</span>
          </button>

          <button
            type="button"
            onClick={openNewModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Expense</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Expenses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Total Expenses</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {formatCurrency(stats?.totalExpenses)}
              </div>
              <div className="text-[11px] font-normal text-slate-400 mt-1">This Month</div>
            </div>
          </div>
        </div>

        {/* Card 2: Total Paid */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowDownCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Total Paid</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {formatCurrency(stats?.totalPaid)}
              </div>
              <div className="text-[11px] font-normal text-slate-400 mt-1">This Month</div>
            </div>
          </div>
        </div>

        {/* Card 3: Total Due */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Total Due</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {formatCurrency(stats?.totalDue)}
              </div>
              <div className="text-[11px] font-normal text-slate-400 mt-1">This Month</div>
            </div>
          </div>
        </div>

        {/* Card 4: Avg. Expense / Day */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 block">Avg. Expense / Day</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {formatCurrency(stats?.avgPerDay)}
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
              placeholder="Search by description, vendor or category..."
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

            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer transition"
              >
                <option>All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Payment Method Dropdown */}
            <div className="relative">
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value as MethodFilterLabel);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer transition"
              >
                <option>All Payment Methods</option>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>Cheque</option>
                <option>Mobile Banking</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

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
                <option>Paid</option>
                <option>Due</option>
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

        {/* Expenses Table */}
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
                <th className="px-6 py-3.5 font-bold">DESCRIPTION</th>
                <th className="px-6 py-3.5 font-bold">CATEGORY</th>
                <th className="px-6 py-3.5 font-bold">VENDOR</th>
                <th className="px-6 py-3.5 font-bold">PAYMENT METHOD</th>
                <th className="px-6 py-3.5 font-bold">AMOUNT (৳)</th>
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
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No expenses found.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click &quot;New Expense&quot; to record one.
                    </p>
                  </td>
                </tr>
              ) : (
                expenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 text-slate-900 font-medium whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.note || item.expenseNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <span
                          className={`w-2 h-2 rounded-full ${categoryDotColor(item.category)}`}
                        />
                        <span>{item.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">
                      {item.vendor || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        {renderMethodIcon(item.paymentMethod)}
                        <span>{METHOD_LABELS[item.paymentMethod]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-500 whitespace-nowrap">
                      {formatAmount(item.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                          item.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {item.status === 'PAID' ? 'Paid' : 'Due'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === item.id ? null : item.id);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4 inline-block" />
                        </button>
                        {openMenuId === item.id && (
                          <div
                            className="absolute right-0 z-20 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-400" />
                              Edit details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingExpense(item);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            {isFetching && !isLoading
              ? 'Loading…'
              : `Showing ${rangeStart} to ${rangeEnd} of ${total} expenses`}
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

      {/* New Expense Modal */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsNewModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record New Expense</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter operational expense or bill payment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Description</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => patchForm({ title: e.target.value })}
                  placeholder="e.g. Facebook Ads Campaign"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    list="expense-category-options"
                    value={form.category}
                    onChange={(e) => patchForm({ category: e.target.value })}
                    placeholder="e.g. Marketing"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                  />
                  <datalist id="expense-category-options">
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={(e) => patchForm({ vendor: e.target.value })}
                    placeholder="e.g. Facebook, Pathao"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => patchForm({ amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) =>
                      patchForm({ paymentMethod: e.target.value as ExpensePaymentMethod })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  >
                    {METHOD_SELECT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => patchForm({ date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => patchForm({ status: e.target.value as ExpenseStatus })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="PAID">Paid</option>
                    <option value="DUE">Due</option>
                  </select>
                </div>
              </div>

              <div
                className={`grid grid-cols-1 gap-3.5 ${
                  form.status === 'PAID' ? 'sm:grid-cols-2' : ''
                }`}
              >
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Account</label>
                  <select
                    value={form.expenseAccountId}
                    onChange={(e) => patchForm({ expenseAccountId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="">Select an expense account</option>
                    {expenseAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} — {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {form.status === 'PAID' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Paid From</label>
                    <select
                      value={form.paidFromAccountId}
                      onChange={(e) => patchForm({ paidFromAccountId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    >
                      <option value="">Select a cash / bank account</option>
                      {assetAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => patchForm({ note: e.target.value })}
                  placeholder="Additional detail shown under the description"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNew}
                disabled={isCreating || !canSaveNew}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition disabled:opacity-50"
              >
                {isCreating ? 'Saving…' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense (metadata) Modal */}
      {editingExpense && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditingExpense(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Expense Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingExpense.expenseNumber} — amounts and posting fields are locked once booked
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  value={editForm.vendor}
                  onChange={(e) => setEditForm((p) => ({ ...p, vendor: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Note</label>
                <input
                  type="text"
                  value={editForm.note}
                  onChange={(e) => setEditForm((p) => ({ ...p, note: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition disabled:opacity-50"
              >
                {isUpdating ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingExpense && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDeletingExpense(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete expense?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {deletingExpense.expenseNumber} — {deletingExpense.title}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              This permanently deletes the expense and voids its linked journal entry. The voided
              entry stays in the ledger for audit but stops counting toward balances and reports.
              This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-rose-600/20 transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Expenses Modal */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsImportModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Import Expenses</h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload CSV or Excel expense spreadsheet</p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Click to upload or drag & drop</p>
              <p className="text-[11px] text-slate-400 mt-0.5">CSV, XLS, XLSX (Max 5MB)</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => toast('CSV import is coming soon')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
