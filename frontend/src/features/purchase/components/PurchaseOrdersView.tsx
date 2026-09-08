'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  Send,
  Truck,
  CheckCircle2,
  Plus,
  Search,
  RotateCcw,
  Eye,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Printer,
  Trash2,
  PackageCheck,
  Landmark,
} from 'lucide-react';
import {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderStatsQuery,
  useGetPurchaseOrderQuery,
  useGetSuppliersQuery,
  useCreatePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  type PurchaseOrderStatus,
} from '../api/purchaseApi';
import {
  LineItemEditor,
  makeEmptyLine,
  lineItemsValid,
  toLineInputs,
  type LineItemDraft,
} from './LineItemEditor';
import { SupplierSelectDropdown } from './SupplierSelectDropdown';
import { CustomDropdown } from './CustomDropdown';

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Finance Approval',
  APPROVED: 'Finance Approved',
  SENT: 'Sent',
  PARTIALLY_RECEIVED: 'Partially Received',
  FULLY_RECEIVED: 'Fully Received',
  CANCELLED: 'Cancelled',
};

const STATUS_BADGE: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200/60',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200/60 font-medium',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 font-semibold',
  SENT: 'bg-blue-50 text-blue-600 border-blue-200/60',
  PARTIALLY_RECEIVED: 'bg-purple-50 text-purple-600 border-purple-200/60',
  FULLY_RECEIVED: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
  CANCELLED: 'bg-rose-50 text-rose-600 border-rose-200/60',
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

export function PurchaseOrdersView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [supplierFilter, setSupplierFilter] = useState('All Suppliers');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isNewPoOpen, setIsNewPoOpen] = useState(false);
  const [detailPoId, setDetailPoId] = useState<string | null>(null);
  const [receivePoId, setReceivePoId] = useState<string | null>(null);

  const statusParam =
    statusFilter === 'All Status'
      ? undefined
      : (Object.keys(STATUS_LABELS).find(
          (k) => STATUS_LABELS[k as PurchaseOrderStatus] === statusFilter,
        ) as PurchaseOrderStatus | undefined);

  const { data: suppliersData } = useGetSuppliersQuery({ limit: 100 });
  const suppliers = suppliersData?.items ?? [];

  const { data, isLoading, isFetching, isError } = useGetPurchaseOrdersQuery({
    search: searchTerm.trim() || undefined,
    status: statusParam,
    supplierId: supplierFilter === 'All Suppliers' ? undefined : supplierFilter,
    page: currentPage,
    limit: perPage,
  });
  const { data: stats } = useGetPurchaseOrderStatsQuery();

  const [createPurchaseOrder, { isLoading: isCreating }] =
    useCreatePurchaseOrderMutation();
  const [cancelPurchaseOrder] = useCancelPurchaseOrderMutation();

  const orders = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const rangeEnd = Math.min(currentPage * perPage, total);

  // ── Create PO form ──
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poOrderDate, setPoOrderDate] = useState(today());
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poStatus, setPoStatus] = useState<'DRAFT' | 'SENT' | 'PENDING_APPROVAL'>('PENDING_APPROVAL');
  const [poNotes, setPoNotes] = useState('');
  const [poLines, setPoLines] = useState<LineItemDraft[]>([makeEmptyLine()]);

  const poGrandTotal = useMemo(
    () => poLines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0),
    [poLines],
  );

  const resetPoForm = () => {
    setPoSupplierId('');
    setPoOrderDate(today());
    setPoExpectedDate('');
    setPoStatus('PENDING_APPROVAL');
    setPoNotes('');
    setPoLines([makeEmptyLine()]);
  };

  const poCanSave = poSupplierId && lineItemsValid(poLines);

  const submitPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poCanSave) {
      toast.error('Choose a supplier and add at least one valid line item.');
      return;
    }

    try {
      await createPurchaseOrder({
        supplierId: poSupplierId,
        orderDate: poOrderDate,
        expectedDate: poExpectedDate || undefined,
        status: poStatus,
        notes: poNotes.trim() || undefined,
        lines: toLineInputs(poLines),
      }).unwrap();
      toast.success(
        poStatus === 'PENDING_APPROVAL'
          ? 'Purchase order created & Finance requisition submitted!'
          : 'Purchase order created.',
      );
      setIsNewPoOpen(false);
      resetPoForm();
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          'Could not create the purchase order.',
      );
    }
  };

  const cancelPo = async (id: string) => {
    setActiveMenuId(null);
    if (!window.confirm('Cancel this purchase order?')) return;
    try {
      await cancelPurchaseOrder(id).unwrap();
      toast.success('Purchase order cancelled.');
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          'Could not cancel the purchase order.',
      );
    }
  };

  const kpiCards = useMemo(
    () => [
      {
        label: 'Total POs',
        icon: FileText,
        tone: 'bg-blue-50 text-blue-600',
        count: stats?.total.count ?? 0,
        amount: stats ? money(stats.total.amount) : '—',
        note: 'This month',
      },
      {
        label: 'Pending Approval',
        icon: Clock,
        tone: 'bg-amber-50 text-amber-600',
        count: stats?.pendingApproval?.count ?? 0,
        amount: stats?.pendingApproval ? money(stats.pendingApproval.amount) : '—',
      },
      {
        label: 'Finance Approved',
        icon: CheckCircle2,
        tone: 'bg-emerald-50 text-emerald-600',
        count: stats?.approved?.count ?? 0,
        amount: stats?.approved ? money(stats.approved.amount) : '—',
      },
      {
        label: 'Partially Received',
        icon: Truck,
        tone: 'bg-purple-50 text-purple-600',
        count: stats?.partiallyReceived.count ?? 0,
        amount: stats ? money(stats.partiallyReceived.amount) : '—',
      },
      {
        label: 'Fully Received',
        icon: PackageCheck,
        tone: 'bg-blue-50 text-blue-600',
        count: stats?.fullyReceived.count ?? 0,
        amount: stats ? money(stats.fullyReceived.amount) : '—',
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
            <span className="text-slate-500">Purchase Orders</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Create and manage purchase orders for your suppliers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewPoOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {kpiCards.map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-3.5"
          >
            <div
              className={`w-10 h-10 rounded-xl ${k.tone} flex items-center justify-center shrink-0`}
            >
              <k.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500">{k.label}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                {k.count}
              </h3>
              <p className="text-[10px] font-bold text-slate-700 mt-0.5">{k.amount}</p>
              {k.note && <p className="text-[9px] text-slate-400">{k.note}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col xl:flex-row items-center justify-between gap-3">
        <div className="relative w-full xl:w-72">
          <input
            type="text"
            placeholder="Search by PO number or supplier..."
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
          <div className="min-w-[140px]">
            <CustomDropdown
              size="sm"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'All Status', label: 'All Status' },
                { value: 'Pending Finance Approval', label: 'Pending Approval', badge: 'Pending', badgeColor: 'bg-amber-50 text-amber-700' },
                { value: 'Finance Approved', label: 'Approved', badge: 'Approved', badgeColor: 'bg-emerald-50 text-emerald-700' },
                { value: 'Draft', label: 'Draft', badge: 'Draft', badgeColor: 'bg-slate-100 text-slate-700' },
                { value: 'Sent', label: 'Sent', badge: 'Sent', badgeColor: 'bg-blue-50 text-blue-700' },
                { value: 'Partially Received', label: 'Partially Received', badge: 'Partial', badgeColor: 'bg-purple-50 text-purple-700' },
                { value: 'Fully Received', label: 'Fully Received', badge: 'Received', badgeColor: 'bg-emerald-50 text-emerald-700' },
                { value: 'Cancelled', label: 'Cancelled', badge: 'Cancelled', badgeColor: 'bg-rose-50 text-rose-700' },
              ]}
            />
          </div>

          <div className="min-w-[170px]">
            <CustomDropdown
              size="sm"
              searchable
              searchPlaceholder="Search supplier..."
              value={supplierFilter}
              onChange={(val) => {
                setSupplierFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'All Suppliers', label: 'All Suppliers' },
                ...suppliers.map((s) => ({
                  value: s.id,
                  label: s.name,
                  subtitle: s.phone || s.location,
                })),
              ]}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('All Status');
              setSupplierFilter('All Suppliers');
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
                <th className="px-4 py-3.5">PO NUMBER</th>
                <th className="px-4 py-3.5">DATE</th>
                <th className="px-4 py-3.5">SUPPLIER</th>
                <th className="px-4 py-3.5">EXPECTED DATE</th>
                <th className="px-4 py-3.5">TOTAL AMOUNT</th>
                <th className="px-4 py-3.5">RECEIVED</th>
                <th className="px-4 py-3.5">STATUS</th>
                <th className="px-4 py-3.5 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-rose-500">
                    Could not load purchase orders.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    No purchase orders yet.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                orders.map((o) => {
                  const pct = Math.round(Number(o.receivedPct));
                  const canReceive =
                    o.status === 'APPROVED' || o.status === 'SENT' || o.status === 'PARTIALLY_RECEIVED';
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-4 font-bold text-slate-900 font-mono text-[11px]">
                        {o.poNumber}
                      </td>
                      <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                        {o.orderDate}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg ${avatarFor(o.supplierName)} font-black text-[11px] flex items-center justify-center shrink-0`}
                          >
                            {o.supplierName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900 text-xs">
                            {o.supplierName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                        {o.expectedDate || '—'}
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900">
                        {money(o.totalAmount)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5 min-w-[120px]">
                          <span className="text-[11px] font-semibold text-slate-600 w-9 text-left">
                            {pct}%
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct >= 100
                                  ? 'bg-emerald-500'
                                  : pct > 0
                                    ? 'bg-orange-500'
                                    : 'bg-transparent'
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${STATUS_BADGE[o.status]}`}
                        >
                          {STATUS_LABELS[o.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailPoId(o.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200/80 rounded-lg hover:border-slate-300 transition shadow-2xs"
                            title="View PO Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canReceive && (
                            <button
                              type="button"
                              onClick={() => setReceivePoId(o.id)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-white border border-slate-200/80 rounded-lg hover:border-slate-300 transition shadow-2xs"
                              title="Receive goods"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(activeMenuId === o.id ? null : o.id)
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition hover:bg-slate-100"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === o.id && (
                              <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 text-left text-xs font-semibold">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    toast('PDF export coming soon.');
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Download PDF</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    toast('Print coming soon.');
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Print PO</span>
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                  type="button"
                                  onClick={() => cancelPo(o.id)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Cancel PO</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">
            {isFetching && !isLoading
              ? 'Loading…'
              : `Showing ${rangeStart} to ${rangeEnd} of ${total} purchase orders`}
          </p>

          <div className="flex items-center gap-3">
            <div className="w-32">
              <CustomDropdown
                size="sm"
                value={String(perPage)}
                onChange={(val) => {
                  setPerPage(Number(val));
                  setCurrentPage(1);
                }}
                options={[
                  { value: '10', label: '10 per page' },
                  { value: '20', label: '20 per page' },
                  { value: '50', label: '50 per page' },
                ]}
              />
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

      {isNewPoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">New Purchase Order</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order products and restock inventory from suppliers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPoOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitPo} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Supplier <span className="text-rose-500">*</span>
                  </label>
                  <SupplierSelectDropdown
                    suppliers={suppliers}
                    value={poSupplierId}
                    onChange={(id) => setPoSupplierId(id)}
                    placeholder="Choose a supplier"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={poOrderDate}
                    onChange={(e) => setPoOrderDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={poExpectedDate}
                    onChange={(e) => setPoExpectedDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <CustomDropdown
                    value={poStatus}
                    onChange={(val) => setPoStatus(val as 'DRAFT' | 'SENT' | 'PENDING_APPROVAL')}
                    options={[
                      {
                        value: 'PENDING_APPROVAL',
                        label: 'Submit for Finance Approval',
                        subtitle: 'Queues budget requisition for Finance approval',
                        icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
                        badge: 'Pending',
                        badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200/60',
                      },
                      {
                        value: 'DRAFT',
                        label: 'Draft',
                        subtitle: 'Internal draft order without requesting funds',
                        icon: <FileText className="w-3.5 h-3.5 text-slate-500" />,
                        badge: 'Draft',
                        badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200/60',
                      },
                      {
                        value: 'SENT',
                        label: 'Direct Sent',
                        subtitle: 'Issued directly without requisition',
                        icon: <Send className="w-3.5 h-3.5 text-blue-600" />,
                        badge: 'Sent',
                        badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/60',
                      },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Line Items
                </label>
                <LineItemEditor value={poLines} onChange={setPoLines} />
              </div>

              {/* Finance Approval Requisition Notice */}
              <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                  <Landmark className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-xs">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">Finance Budget & Disbursement Flow</h4>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                      Finance Approval Required
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Submitting this purchase order will automatically queue a budget requisition in the{' '}
                    <span className="font-bold text-slate-800">Finance</span> module. The Finance team
                    will review the total amount (৳ {poGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}),
                    select which bank or cash account to deduct payment from, and approve disbursement.
                    Once approved, this order will update to <span className="font-bold text-emerald-600">Finance Approved</span> and appear ready for receipt.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Order Notes / Terms
                </label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Add any specific instructions for the supplier..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPoOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !poCanSave}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  {isCreating ? 'Saving…' : 'Generate PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailPoId && (
        <PurchaseOrderDetailModal
          id={detailPoId}
          onClose={() => setDetailPoId(null)}
        />
      )}

      {receivePoId && (
        <ReceivePurchaseOrderModal
          id={receivePoId}
          onClose={() => setReceivePoId(null)}
        />
      )}
    </div>
  );
}

function PurchaseOrderDetailModal({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { data: po, isLoading } = useGetPurchaseOrderQuery(id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {po ? po.poNumber : 'Purchase Order'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {po ? `${po.supplierName} · ${po.orderDate}` : 'Loading…'}
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

        <div className="p-5 overflow-y-auto">
          {isLoading || !po ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-slate-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Product</th>
                    <th className="px-3 py-2 text-right font-medium">Ordered</th>
                    <th className="px-3 py-2 text-right font-medium">Received</th>
                    <th className="px-3 py-2 text-right font-medium">Unit cost</th>
                    <th className="px-3 py-2 text-right font-medium">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {po.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="px-3 py-2">
                        {l.productName}
                        {l.sku ? (
                          <span className="text-slate-400"> · {l.sku}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-right">{l.quantity}</td>
                      <td className="px-3 py-2 text-right">{l.receivedQuantity}</td>
                      <td className="px-3 py-2 text-right">{money(l.unitCost)}</td>
                      <td className="px-3 py-2 text-right">{money(l.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td
                      colSpan={4}
                      className="px-3 py-2 text-right text-sm font-medium text-slate-600"
                    >
                      Total
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-semibold text-slate-900">
                      {money(po.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReceivePurchaseOrderModal({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { data: po, isLoading } = useGetPurchaseOrderQuery(id);
  const [receivePurchaseOrder, { isLoading: isReceiving }] =
    useReceivePurchaseOrderMutation();
  const [receiveNow, setReceiveNow] = useState<Record<string, number>>({});

  const remaining = (lineId: string) => {
    const line = po?.lines.find((l) => l.id === lineId);
    if (!line) return 0;
    return line.quantity - line.receivedQuantity;
  };

  const setQty = (lineId: string, value: number) => {
    const max = remaining(lineId);
    setReceiveNow((prev) => ({
      ...prev,
      [lineId]: Math.max(0, Math.min(max, value)),
    }));
  };

  const anyToReceive = Object.values(receiveNow).some((n) => n > 0);

  const submit = async () => {
    if (!po) return;
    const lines = Object.entries(receiveNow)
      .filter(([, qty]) => qty > 0)
      .map(([lineId, receivedQuantity]) => ({ lineId, receivedQuantity }));
    if (lines.length === 0) {
      toast.error('Enter a quantity to receive for at least one line.');
      return;
    }
    try {
      await receivePurchaseOrder({
        id: po.id,
        lines,
        receivedDate: today(),
      }).unwrap();
      toast.success('Stock received. Inventory updated.');
      onClose();
    } catch (err) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          'Could not receive the goods.',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Receive against {po?.poNumber ?? '…'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the quantity received now for each line.
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

        <div className="p-5 overflow-y-auto space-y-3">
          {isLoading || !po ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Product</th>
                    <th className="px-3 py-2 text-right font-medium">Ordered</th>
                    <th className="px-3 py-2 text-right font-medium">Received</th>
                    <th className="px-3 py-2 text-right font-medium w-28">
                      Receive now
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {po.lines.map((l) => {
                    const max = l.quantity - l.receivedQuantity;
                    return (
                      <tr key={l.id}>
                        <td className="px-3 py-2">{l.productName}</td>
                        <td className="px-3 py-2 text-right">{l.quantity}</td>
                        <td className="px-3 py-2 text-right">{l.receivedQuantity}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            max={max}
                            disabled={max === 0}
                            value={receiveNow[l.id] ?? ''}
                            onChange={(e) =>
                              setQty(l.id, Number(e.target.value) || 0)
                            }
                            className="w-20 rounded-md border border-slate-200 px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isReceiving || !anyToReceive}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            {isReceiving ? 'Receiving…' : 'Receive Goods'}
          </button>
        </div>
      </div>
    </div>
  );
}
