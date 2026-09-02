'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Package,
  Wallet,
  Clock,
  Plus,
  Search,
  RotateCcw,
  Eye,
  Edit2,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Download,
  Receipt,
  Trash2,
} from 'lucide-react';
import {
  useGetBillsQuery,
  useGetBillStatsQuery,
  useGetBillQuery,
  useGetSuppliersQuery,
  useGetSupplierPaymentsQuery,
  useCreateBillMutation,
  useUpdateBillMutation,
  useDeleteBillMutation,
  useRecordSupplierPaymentMutation,
  type BillListItem,
  type BillPaymentStatus,
} from '../api/purchaseApi';
import { useGetAccountsQuery } from '@/features/accounting/api/accountingApi';
import {
  LineItemEditor,
  makeEmptyLine,
  lineItemsValid,
  toLineInputs,
  type LineItemDraft,
} from './LineItemEditor';

const STATUS_LABELS: Record<BillPaymentStatus, string> = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partial',
  PAID: 'Paid',
};
const STATUS_BADGE: Record<BillPaymentStatus, string> = {
  PAID: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
  PARTIAL: 'bg-amber-50 text-amber-600 border-amber-200/60',
  UNPAID: 'bg-rose-50 text-rose-600 border-rose-200/60',
};

const AVATAR_STYLES = [
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-purple-100 text-purple-600',
  'bg-orange-100 text-orange-600',
  'bg-amber-100 text-amber-600',
];
const avatarFor = (name: string) =>
  AVATAR_STYLES[(name.charCodeAt(0) || 0) % AVATAR_STYLES.length];

const money = (v: string | number) =>
  `৳ ${Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const today = () => new Date().toISOString().slice(0, 10);

const deltaClass = (pct: string) =>
  Number(pct) >= 0 ? 'text-emerald-600' : 'text-rose-600';
const deltaArrow = (pct: string) => (Number(pct) >= 0 ? '↑' : '↓');

export function PurchasesListView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('All Suppliers');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [detailBillId, setDetailBillId] = useState<string | null>(null);
  const [editBill, setEditBill] = useState<BillListItem | null>(null);
  const [paymentBill, setPaymentBill] = useState<BillListItem | null>(null);

  const { data: suppliersData } = useGetSuppliersQuery({ limit: 100 });
  const suppliers = suppliersData?.items ?? [];

  const statusParam =
    statusFilter === 'All Status'
      ? undefined
      : (statusFilter.toUpperCase() as BillPaymentStatus);

  const { data, isLoading, isFetching, isError } = useGetBillsQuery({
    search: searchTerm.trim() || undefined,
    status: statusParam,
    supplierId: supplierFilter === 'All Suppliers' ? undefined : supplierFilter,
    page: currentPage,
    limit: perPage,
  });
  const { data: stats } = useGetBillStatsQuery();

  const [createBill, { isLoading: isCreating }] = useCreateBillMutation();
  const [deleteBill] = useDeleteBillMutation();

  const bills = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const rangeEnd = Math.min(currentPage * perPage, total);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? bills.map((b) => b.id) : []);
  };
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  // ── Record Purchase form ──
  const [billSupplierId, setBillSupplierId] = useState('');
  const [billDate, setBillDate] = useState(today());
  const [billInvoiceNo, setBillInvoiceNo] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  const [billLines, setBillLines] = useState<LineItemDraft[]>([makeEmptyLine()]);
  const [billPaidAmount, setBillPaidAmount] = useState(0);
  const [billPaymentMethod, setBillPaymentMethod] = useState<
    'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE' | 'MOBILE_BANKING'
  >('CASH');

  const resetBillForm = () => {
    setBillSupplierId('');
    setBillDate(today());
    setBillInvoiceNo('');
    setBillDueDate('');
    setBillLines([makeEmptyLine()]);
    setBillPaidAmount(0);
    setBillPaymentMethod('CASH');
  };

  const billCanSave = billSupplierId && lineItemsValid(billLines);

  const submitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billCanSave) {
      toast.error('Choose a supplier and add at least one valid line item.');
      return;
    }
    try {
      const created = await createBill({
        supplierId: billSupplierId,
        billDate,
        supplierInvoiceNo: billInvoiceNo.trim() || undefined,
        dueDate: billDueDate || undefined,
        paidAmount: billPaidAmount > 0 ? billPaidAmount : undefined,
        paymentMethod: billPaidAmount > 0 ? billPaymentMethod : undefined,
        lines: toLineInputs(billLines),
      }).unwrap();
      toast.success(
        created.journalEntryId
          ? 'Purchase recorded. Journal entry posted.'
          : 'Purchase recorded.',
      );
      setIsRecordOpen(false);
      resetBillForm();
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          'Could not record the purchase.',
      );
    }
  };

  const removeBill = async (b: BillListItem) => {
    setActiveMenuId(null);
    if (!window.confirm(`Delete purchase ${b.billNumber}?`)) return;
    try {
      const res = await deleteBill(b.id).unwrap();
      toast.success(res.message ?? 'Purchase deleted.');
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          'Could not delete the purchase.',
      );
    }
  };

  const kpiCards = useMemo(
    () => [
      {
        label: 'Total Purchases',
        icon: ShoppingCart,
        tone: 'bg-emerald-50 text-emerald-600',
        value: stats ? money(stats.totalPurchases.value) : '—',
        pct: stats?.totalPurchases.momPct ?? '0.00',
      },
      {
        label: 'Total Items Received',
        icon: Package,
        tone: 'bg-blue-50 text-blue-600',
        value: stats
          ? Number(stats.totalItemsReceived.value).toLocaleString()
          : '—',
        pct: stats?.totalItemsReceived.momPct ?? '0.00',
      },
      {
        label: 'Total Paid',
        icon: Wallet,
        tone: 'bg-rose-50 text-rose-500',
        value: stats ? money(stats.totalPaid.value) : '—',
        pct: stats?.totalPaid.momPct ?? '0.00',
      },
      {
        label: 'Outstanding Due',
        icon: Clock,
        tone: 'bg-amber-50 text-amber-500',
        value: stats ? money(stats.outstandingDue.value) : '—',
        pct: stats?.outstandingDue.momPct ?? '0.00',
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-6 pb-12 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
            <Link href="/dashboard/purchase" className="text-blue-600 hover:underline">
              Purchase
            </Link>
            <span className="text-slate-400">›</span>
            <span className="text-slate-500">Purchases</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchases</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage your purchases, receive stock and track supplier payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toast('CSV import is coming soon.')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRecordOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-2xl ${k.tone} flex items-center justify-center shrink-0`}
            >
              <k.icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500">{k.label}</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {k.value}
              </h3>
              <p className={`text-[10px] font-bold mt-0.5 ${deltaClass(k.pct)}`}>
                {deltaArrow(k.pct)} {Math.abs(Number(k.pct)).toFixed(1)}%{' '}
                <span className="text-slate-400 font-medium">vs. previous month</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col xl:flex-row items-center justify-between gap-3">
        <div className="relative w-full xl:w-72">
          <input
            type="text"
            placeholder="Search by purchase number, supplier..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-4 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
          <div className="relative flex items-center">
            <label className="text-[10px] uppercase font-bold text-slate-400 absolute -top-2 left-2 px-1 bg-white leading-none">
              Supplier
            </label>
            <select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-slate-700 outline-none hover:border-slate-300 appearance-none shadow-2xs cursor-pointer min-w-[130px]"
            >
              <option value="All Suppliers">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative flex items-center">
            <label className="text-[10px] uppercase font-bold text-slate-400 absolute -top-2 left-2 px-1 bg-white leading-none">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-slate-700 outline-none hover:border-slate-300 appearance-none shadow-2xs cursor-pointer min-w-[120px]"
            >
              <option>All Status</option>
              <option>Paid</option>
              <option>Partial</option>
              <option>Unpaid</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSupplierFilter('All Suppliers');
              setStatusFilter('All Status');
              setSelectedIds([]);
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={bills.length > 0 && selectedIds.length === bills.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                </th>
                <th className="px-4 py-3.5">PURCHASE NO.</th>
                <th className="px-4 py-3.5">DATE</th>
                <th className="px-4 py-3.5">SUPPLIER</th>
                <th className="px-4 py-3.5">ITEMS</th>
                <th className="px-4 py-3.5">TOTAL AMOUNT</th>
                <th className="px-4 py-3.5">PAID AMOUNT</th>
                <th className="px-4 py-3.5">DUE AMOUNT</th>
                <th className="px-4 py-3.5">STATUS</th>
                <th className="px-4 py-3.5 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-rose-500">
                    Could not load purchases.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && bills.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                    No purchases yet. Record your first purchase.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(b.id)}
                        onChange={() => toggleSelect(b.id)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900 font-mono text-[11px]">
                      {b.billNumber}
                    </td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                      {b.billDate}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg ${avatarFor(b.supplierName)} font-black text-[11px] flex items-center justify-center shrink-0`}
                        >
                          {b.supplierName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 text-xs">
                          {b.supplierName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                      {b.itemsCount} items
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900">
                      {money(b.totalAmount)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {money(b.paidAmount)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {money(b.dueAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${STATUS_BADGE[b.paymentStatus]}`}
                      >
                        {STATUS_LABELS[b.paymentStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailBillId(b.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200/80 rounded-lg hover:border-slate-300 transition shadow-2xs"
                          title="View Purchase Bill"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditBill(b)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200/80 rounded-lg hover:border-slate-300 transition shadow-2xs"
                          title="Edit Purchase"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === b.id ? null : b.id)
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition hover:bg-slate-100"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === b.id && (
                            <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 text-left text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setPaymentBill(b);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50"
                              >
                                <Receipt className="w-3.5 h-3.5 text-slate-400" />
                                <span>Record Payment</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  toast('Invoice download is coming soon.');
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                                <span>Download Invoice</span>
                              </button>
                              <div className="h-px bg-slate-100 my-1" />
                              <button
                                type="button"
                                onClick={() => removeBill(b)}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete Purchase</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">
            {isFetching && !isLoading
              ? 'Loading…'
              : `Showing ${rangeStart} to ${rangeEnd} of ${total} purchases`}
          </p>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-slate-700 outline-none hover:border-slate-300 appearance-none shadow-2xs cursor-pointer"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-bold text-slate-600">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isRecordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record New Purchase</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter bill details from the vendor invoice
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitBill} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Supplier
                  </label>
                  <select
                    value={billSupplierId}
                    onChange={(e) => setBillSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="">Choose a supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Purchase / Invoice Date
                  </label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vendor Invoice No.
                  </label>
                  <input
                    type="text"
                    value={billInvoiceNo}
                    onChange={(e) => setBillInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-556"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Line Items
                </label>
                <LineItemEditor value={billLines} onChange={setBillLines} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount paid now (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={billPaidAmount}
                    onChange={(e) =>
                      setBillPaidAmount(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                {billPaidAmount > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={billPaymentMethod}
                      onChange={(e) =>
                        setBillPaymentMethod(e.target.value as typeof billPaymentMethod)
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CARD">Card</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="MOBILE_BANKING">Mobile Banking</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecordOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !billCanSave}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  {isCreating ? 'Saving…' : 'Save Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailBillId && (
        <BillDetailModal id={detailBillId} onClose={() => setDetailBillId(null)} />
      )}
      {editBill && (
        <EditBillModal bill={editBill} onClose={() => setEditBill(null)} />
      )}
      {paymentBill && (
        <RecordPaymentModal bill={paymentBill} onClose={() => setPaymentBill(null)} />
      )}
    </div>
  );
}

function BillDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: bill, isLoading } = useGetBillQuery(id);
  const { data: paymentsData } = useGetSupplierPaymentsQuery({ billId: id });
  const payments = paymentsData?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {bill ? bill.billNumber : 'Purchase Bill'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {bill ? `${bill.supplierName} · ${bill.billDate}` : 'Loading…'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {isLoading || !bill ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
            ))
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Product</th>
                      <th className="px-3 py-2 text-right font-medium">Qty</th>
                      <th className="px-3 py-2 text-right font-medium">Unit cost</th>
                      <th className="px-3 py-2 text-right font-medium">Line total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bill.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="px-3 py-2">
                          {l.productName}
                          {l.sku ? (
                            <span className="text-slate-400"> · {l.sku}</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-right">{l.quantity}</td>
                        <td className="px-3 py-2 text-right">{money(l.unitCost)}</td>
                        <td className="px-3 py-2 text-right">{money(l.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right text-sm font-medium text-slate-600"
                      >
                        Total / Paid / Due
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-semibold text-slate-900">
                        {money(bill.totalAmount)} / {money(bill.paidAmount)} /{' '}
                        {money(
                          Number(bill.totalAmount) - Number(bill.paidAmount),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Payments</h4>
                {payments.length === 0 ? (
                  <p className="text-xs text-slate-400">No payments recorded yet.</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {payments.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                      >
                        <span className="font-mono text-slate-600">
                          {p.paymentNumber}
                        </span>
                        <span className="text-slate-500">
                          {p.paymentDate} · {p.method}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {money(p.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EditBillModal({
  bill,
  onClose,
}: {
  bill: BillListItem;
  onClose: () => void;
}) {
  const [updateBill, { isLoading }] = useUpdateBillMutation();
  const [invoiceNo, setInvoiceNo] = useState(bill.supplierInvoiceNo ?? '');
  const [dueDate, setDueDate] = useState(bill.dueDate ?? '');
  const [notes, setNotes] = useState(bill.notes ?? '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBill({
        id: bill.id,
        supplierInvoiceNo: invoiceNo.trim() || undefined,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success('Purchase updated.');
      onClose();
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          'Could not update the purchase.',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Edit {bill.billNumber}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Vendor Invoice No.
            </label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              {isLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecordPaymentModal({
  bill,
  onClose,
}: {
  bill: BillListItem;
  onClose: () => void;
}) {
  const [recordPayment, { isLoading }] = useRecordSupplierPaymentMutation();
  const { data: accountsData } = useGetAccountsQuery({ activeOnly: true });
  const assetAccounts = (accountsData ?? []).filter((a) => a.type === 'ASSET');

  const due = Number(bill.totalAmount) - Number(bill.paidAmount);
  const [amount, setAmount] = useState(due);
  const [paymentDate, setPaymentDate] = useState(today());
  const [method, setMethod] = useState<
    'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE' | 'MOBILE_BANKING'
  >('CASH');
  const [paidFromAccountId, setPaidFromAccountId] = useState('');
  const [reference, setReference] = useState('');

  const canSave = amount > 0 && amount <= due + 0.001;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      toast.error('Enter an amount within the outstanding balance.');
      return;
    }
    try {
      await recordPayment({
        supplierId: bill.supplierId,
        billId: bill.id,
        paymentDate,
        amount: Number(amount.toFixed(2)),
        method,
        paidFromAccountId: paidFromAccountId || undefined,
        reference: reference.trim() || undefined,
      }).unwrap();
      toast.success('Payment recorded.');
      onClose();
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          'Could not record the payment.',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {bill.billNumber} · outstanding {money(due)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount (৳)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
                <option value="MOBILE_BANKING">Mobile Banking</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paid From
              </label>
              <select
                value={paidFromAccountId}
                onChange={(e) => setPaidFromAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">Default (mapped)</option>
                {assetAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Cheque no. / transaction id"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !canSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              {isLoading ? 'Saving…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
