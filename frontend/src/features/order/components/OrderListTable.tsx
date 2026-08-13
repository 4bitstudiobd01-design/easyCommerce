'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { 
  useGetMerchantOrdersQuery, 
  useGetMerchantOrderKpisQuery,
  useUpdateOrderStatusMutation, 
  Order, 
  OrderStatusType 
} from '../api/orderApi';
import { BulkActionPreviewModal } from './BulkActionPreviewModal';
import { InvoiceModal } from './InvoiceModal';
import { OrderDetailPanel } from './OrderDetailPanel';
import { useBulkUpdateOrderStatusMutation } from '../api/orderApi';
import { ThermalLabelModal } from './ThermalLabelModal';
import { useDebounce } from '@/hooks/useDebounce';
import {
  ShoppingCart,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  CreditCard,
  ChevronDown,
  Printer,
  Tag,
  Plus,
  Calendar,
  Users,
  Search,
  Download,
  Filter,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

interface OrderListTableProps {
  onDispatchCourierClick?: (order: Order) => void;
  onCreateOrderClick?: () => void;
}

export function OrderListTable({ onDispatchCourierClick, onCreateOrderClick }: OrderListTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read params from URL
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const urlLimit = parseInt(searchParams.get('limit') || '20', 10);
  const urlStatus = searchParams.get('status') as OrderStatusType | null;
  const urlPaymentStatus = searchParams.get('paymentStatus');
  const urlCourier = searchParams.get('courier');
  const urlDateRange = searchParams.get('dateRange');
  const urlSearch = searchParams.get('search') || '';
  const urlSortOrder = (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC';

  // Local State synchronized with URL where necessary
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 500);

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedThermalOrder, setSelectedThermalOrder] = useState<Order | null>(null);
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Queries
  const { data: kpis, isLoading: isKpisLoading } = useGetMerchantOrderKpisQuery();
  
  // Relative range in the URL keeps shared links meaningful; resolved to a concrete
  // timestamp only when building the request.
  const dateFrom = (() => {
    const days = Number(urlDateRange);
    if (!Number.isFinite(days) || days <= 0) return undefined;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  })();

  const queryParams = {
    page: urlPage,
    limit: urlLimit,
    status: (urlStatus as string) === 'ALL' ? undefined : urlStatus || undefined,
    paymentStatus: urlPaymentStatus === 'ALL' ? undefined : urlPaymentStatus || undefined,
    courier: urlCourier === 'ALL' ? undefined : urlCourier || undefined,
    dateFrom,
    search: debouncedSearch || undefined,
    sortBy: 'createdAt',
    sortOrder: urlSortOrder,
  };

  const { data: ordersResponse, isLoading: isOrdersLoading, isFetching } = useGetMerchantOrdersQuery(queryParams);
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [bulkAction, setBulkAction] = useState<{ title: string; targetStatus: OrderStatusType; requireReason?: boolean } | null>(null);

  const [bulkUpdateStatus, { isLoading: isBulkUpdating }] = useBulkUpdateOrderStatusMutation();

  const handleBulkActionConfirm = async (reason?: string) => {
    if (!bulkAction) return;

    try {
      const result = await bulkUpdateStatus({
        orderIds: selectAllMatching ? undefined : selectedOrders,
        selectAllMatching,
        filters: selectAllMatching ? queryParams : undefined,
        targetStatus: bulkAction.targetStatus,
        reason,
      }).unwrap();

      toast.success(`Successfully updated ${result.successful} orders. Failed: ${result.failed}`);
      setBulkAction(null);
      setSelectedOrders([]);
      setSelectAllMatching(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Bulk operation failed.');
    }
  };

  const handleExportSelectedCsv = async () => {
    try {
      toast.info('Preparing export...');
      const token = localStorage.getItem('easycommerce_token');
      const storeId = localStorage.getItem('easycommerce_active_store_id');
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'}/orders/bulk/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-store-id': storeId || '',
        },
        body: JSON.stringify({
          orderIds: selectAllMatching ? undefined : selectedOrders,
          selectAllMatching,
          filters: selectAllMatching ? queryParams : undefined,
        }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-export-${new Date().getTime()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Export completed successfully');
      // If we only wanted to export without keeping selection, we can reset:
      // setSelectedOrders([]); 
      // setSelectAllMatching(false);
    } catch (err) {
      toast.error('Failed to export orders');
    }
  };


  const rawOrdersData = ordersResponse?.data ?? ordersResponse;
  const orders: Order[] = Array.isArray(rawOrdersData)
    ? rawOrdersData
    : Array.isArray((rawOrdersData as any)?.data)
    ? (rawOrdersData as any).data
    : Array.isArray((ordersResponse as any)?.data)
    ? (ordersResponse as any).data
    : [];

  const rawMeta = (rawOrdersData as any)?.meta || (ordersResponse as any)?.meta;
  const meta = rawMeta || { page: 1, limit: 20, total: orders.length, totalPages: 1 };

  // Sync Search with URL
  useEffect(() => {
    updateUrlParams({ search: debouncedSearch, page: '1' });
  }, [debouncedSearch]);

  const updateUrlParams = (updates: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'ALL') {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    
    // Always keep page at 1 when changing filters, unless explicitly changing page
    if (!updates.hasOwnProperty('page') && Object.keys(updates).some(k => k !== 'sortOrder' && k !== 'page')) {
      current.set('page', '1');
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.replace(`${pathname}${query}`);
  };

  const handleStatusChange = async (orderId: string, newStatus: any) => {
    try {
      await updateOrderStatus({ id: orderId, orderStatus: newStatus }).unwrap();
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update order status.');
    }
  };

  // Resolved from the current page rather than held in state, so the panel reflects
  // refreshed list data (and closes on its own if the order leaves the active filter).
  const previewOrder = orders.find((o) => o.id === previewOrderId) ?? null;

  const handlePanelConfirm = (order: Order) => handleStatusChange(order.id, 'CONFIRMED');

  const dateRangeLabels: Record<string, string> = {
    '7': 'Last 7 days',
    '30': 'Last 30 days',
    '90': 'Last 90 days',
  };

  const activeFilterChips: { key: string; label: string }[] = [
    urlStatus && urlStatus !== ('ALL' as OrderStatusType)
      ? { key: 'status', label: `Status: ${String(urlStatus).replace(/_/g, ' ')}` }
      : null,
    urlPaymentStatus && urlPaymentStatus !== 'ALL'
      ? { key: 'paymentStatus', label: `Payment: ${urlPaymentStatus}` }
      : null,
    urlCourier && urlCourier !== 'ALL' ? { key: 'courier', label: `Courier: ${urlCourier}` } : null,
    urlDateRange && urlDateRange !== 'ALL'
      ? { key: 'dateRange', label: `Date: ${dateRangeLabels[urlDateRange] ?? urlDateRange}` }
      : null,
    urlSearch ? { key: 'search', label: `Search: ${urlSearch}` } : null,
  ].filter((chip): chip is { key: string; label: string } => chip !== null);

  
  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length && orders.length > 0) {
      setSelectedOrders([]);
      setSelectAllMatching(false);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
      setSelectAllMatching(false);
    }
  };


  const toggleSelectOrder = (id: string) => {
    if (selectAllMatching) setSelectAllMatching(false);
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((item) => item !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const handleExportCsv = () => {
    if (orders.length === 0) {
      toast.error('No orders on this page to export.');
      return;
    }

    const headers = ['Order Number', 'Customer Name', 'Phone', 'Status', 'Payment Status', 'Grand Total', 'Created At'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.customerName,
      o.customerPhone,
      o.orderStatus,
      o.paymentStatus,
      Number(o.grandTotal).toFixed(2),
      new Date(o.createdAt).toISOString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported current page to CSV.`);
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'PENDING', label: 'New' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'PROCESSING', label: 'Processing' },
    { id: 'READY_TO_SHIP', label: 'Ready to Ship' },
    { id: 'SHIPPED', label: 'Shipped' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'RETURNED', label: 'Returned' },
  ];

  return (
    <div className="space-y-6">
      <InvoiceModal
        isOpen={Boolean(selectedInvoiceOrder)}
        onClose={() => setSelectedInvoiceOrder(null)}
        order={selectedInvoiceOrder}
      />

      <ThermalLabelModal
        isOpen={Boolean(selectedThermalOrder)}
        onClose={() => setSelectedThermalOrder(null)}
        order={selectedThermalOrder}
      />

      
      {/* BULK ACTION PREVIEW MODAL */}
      {bulkAction && (
        <BulkActionPreviewModal
          isOpen={true}
          onClose={() => setBulkAction(null)}
          onConfirm={handleBulkActionConfirm}
          actionTitle={bulkAction.title}
          targetStatus={bulkAction.targetStatus}
          selectedCount={selectedOrders.length}
          isAllMatching={selectAllMatching}
          totalMatching={meta.total}
          isLoading={isBulkUpdating}
          requireReason={bulkAction.requireReason}
        />
      )}

      {/* BULK SELECTION TOOLBAR */}
      {selectedOrders.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-xl sticky top-4 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="flex items-center gap-4 text-white mb-4 sm:mb-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 font-bold text-sm">
              {selectAllMatching ? meta.total : selectedOrders.length}
            </div>
            <div className="text-sm">
              <span className="font-bold">orders selected</span>
              {!selectAllMatching && selectedOrders.length === orders.length && meta.total > orders.length && (
                <div className="text-slate-400 mt-0.5 text-xs">
                  All {orders.length} orders on this page are selected.{' '}
                  <button 
                    onClick={() => setSelectAllMatching(true)}
                    className="text-blue-400 hover:text-blue-300 font-bold underline"
                  >
                    Select all {meta.total} matching orders
                  </button>
                </div>
              )}
              {selectAllMatching && (
                <div className="text-blue-400 mt-0.5 text-xs font-bold">
                  All {meta.total} matching orders are selected.
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBulkAction({ title: 'Confirm', targetStatus: 'CONFIRMED' })}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setBulkAction({ title: 'Mark Processing', targetStatus: 'PROCESSING' })}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Processing
            </button>
            <button
              onClick={() => setBulkAction({ title: 'Mark Ready to Ship', targetStatus: 'READY_TO_SHIP' })}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Ready to Ship
            </button>
            <button
              onClick={() => setBulkAction({ title: 'Cancel', targetStatus: 'CANCELLED', requireReason: true })}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1 hidden sm:block"></div>
            <button
              onClick={handleExportSelectedCsv}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export {selectAllMatching ? 'All' : 'Selected'}
            </button>
            <button
              onClick={() => { setSelectedOrders([]); setSelectAllMatching(false); }}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}


      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Orders</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage, review and fulfill customer orders.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={onCreateOrderClick || (() => toast('Manual order creation coming soon.'))}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Order ▾</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'ALL',
            label: 'Total Orders',
            value: kpis?.totalOrders,
            trend: kpis?.trends?.totalOrders,
            icon: <Calendar className="w-5 h-5" />,
            iconClass: 'bg-blue-50 text-blue-600',
            hoverClass: 'hover:border-blue-300',
          },
          {
            id: 'PENDING',
            label: 'Pending Confirmation',
            value: kpis?.pendingConfirmation,
            action: 'View orders',
            icon: <Clock className="w-5 h-5" />,
            iconClass: 'bg-amber-50 text-amber-600',
            hoverClass: 'hover:border-amber-300',
          },
          {
            id: 'READY_TO_SHIP',
            label: 'Ready to Ship',
            value: kpis?.readyToShip,
            action: 'View orders',
            icon: <Truck className="w-5 h-5" />,
            iconClass: 'bg-sky-50 text-sky-600',
            hoverClass: 'hover:border-blue-300',
          },
          {
            id: 'DELIVERED',
            label: 'Delivered',
            value: kpis?.delivered,
            trend: kpis?.trends?.delivered,
            icon: <CheckCircle2 className="w-5 h-5" />,
            iconClass: 'bg-emerald-50 text-emerald-600',
            hoverClass: 'hover:border-emerald-300',
          },
        ].map((card) => (
          <button
            key={card.id}
            onClick={() => updateUrlParams({ status: card.id })}
            className={`bg-white p-5 rounded-2xl border border-slate-200 flex flex-col text-left transition-colors ${card.hoverClass}`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconClass}`}
              >
                {card.icon}
              </span>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-slate-500 block">{card.label}</span>
                <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">
                  {isKpisLoading ? '—' : (card.value ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {typeof card.trend === 'number' ? (
              <span
                className={`mt-3 text-[11px] font-bold ${
                  card.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {card.trend >= 0 ? '↑' : '↓'} {Math.abs(card.trend)}%{' '}
                <span className="text-slate-400 font-semibold">vs last 7 days</span>
              </span>
            ) : card.action ? (
              <span className="mt-3 text-[11px] font-bold text-blue-600">{card.action} →</span>
            ) : (
              <span className="mt-3 text-[11px] font-semibold text-slate-400">
                No prior data
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 3. Toolbar (Search & Filters) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-100 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {(urlPaymentStatus && urlPaymentStatus !== 'ALL') && (
            <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px]">1</span>
          )}
        </button>

        <div className="relative">
          <select
            value={urlPaymentStatus || 'ALL'}
            onChange={(e) => updateUrlParams({ paymentStatus: e.target.value })}
            className="appearance-none pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">Payment: All</option>
            <option value="UNPAID">Payment: Unpaid (COD)</option>
            <option value="PAID">Payment: Paid</option>
            <option value="REFUNDED">Payment: Refunded</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={urlCourier || 'ALL'}
            onChange={(e) => updateUrlParams({ courier: e.target.value })}
            className="appearance-none pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">Courier: All</option>
            <option value="STEADFAST">Courier: Steadfast</option>
            <option value="PATHAO">Courier: Pathao</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={urlDateRange || 'ALL'}
            onChange={(e) => updateUrlParams({ dateRange: e.target.value })}
            className="appearance-none pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">Date: All time</option>
            <option value="7">Date: Last 7 days</option>
            <option value="30">Date: Last 30 days</option>
            <option value="90">Date: Last 90 days</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        <div className="relative">
          <select 
            value={urlLimit.toString()}
            onChange={(e) => updateUrlParams({ limit: e.target.value, page: '1' })}
            className="appearance-none pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="20">Show: 20</option>
            <option value="50">Show: 50</option>
            <option value="100">Show: 100</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
        
        <button
          onClick={() => updateUrlParams({ sortOrder: urlSortOrder === 'DESC' ? 'ASC' : 'DESC' })}
          className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-100 transition-colors"
          title={`Sorted ${urlSortOrder === 'DESC' ? 'Newest' : 'Oldest'} First`}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>{urlSortOrder === 'DESC' ? 'Newest' : 'Oldest'}</span>
        </button>

        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by order ID, customer, phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Filters
          </span>
          {activeFilterChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => {
                  // The search box is debounced into the URL, so clearing the chip alone
                  // would be undone on the next debounce tick.
                  if (chip.key === 'search') setSearchInput('');
                  updateUrlParams({ [chip.key]: null });
                }}
                aria-label={`Remove ${chip.label} filter`}
                className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              updateUrlParams({
                status: null,
                paymentStatus: null,
                courier: null,
                dateRange: null,
                search: null,
              });
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* 4. Order list (detail drawer overlays the page, so the list stays full width) */}
      <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200">
        {filterTabs.map((tab) => {
          const isActive = (urlStatus || 'ALL') === tab.id;
          const count = tab.id === 'ALL' ? meta.total : kpis?.statusCounts?.[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => updateUrlParams({ status: tab.id })}
              className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {typeof count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
        {/* Loading Overlay (Optional for soft refreshes) */}
        {isFetching && !isOrdersLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5">Order</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Items</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Total</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Delivery</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isOrdersLoading ? (
                <>
                  <TableRowSkeleton columns={10} />
                  <TableRowSkeleton columns={10} />
                  <TableRowSkeleton columns={10} />
                  <TableRowSkeleton columns={10} />
                  <TableRowSkeleton columns={10} />
                </>
              ) : orders?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-700">No orders found</h3>
                    <p className="text-xs text-slate-500 mt-1">Try changing your filters or search criteria.</p>
                    <button 
                      onClick={() => router.push(pathname)}
                      className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                orders?.map((order) => {
                  const isChecked = selectedOrders.includes(order.id);
                  const customerInitials = order.customerName
                    ? order.customerName.substring(0, 2).toUpperCase()
                    : 'CU';

                  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        previewOrderId === order.id
                          ? 'bg-blue-50/60'
                          : isChecked
                          ? 'bg-blue-50/30'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewOrderId((current) => (current === order.id ? null : order.id))
                          }
                          aria-expanded={previewOrderId === order.id}
                          className="font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          #{order.orderNumber}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                            {customerInitials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{order.customerName}</span>
                            <span className="text-[10px] text-slate-400 block">{order.customerPhone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">{itemCount} items</td>
                      <td className="px-6 py-4 text-slate-600">{formattedDate}</td>
                      <td className="px-6 py-4 font-black text-slate-900">৳{Number(order.grandTotal).toLocaleString()}</td>

                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                          order.paymentStatus === 'REFUNDED' ? 'bg-slate-100 text-slate-600' :
                          order.paymentMethod === 'COD' ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {order.paymentStatus === 'UNPAID' && order.paymentMethod === 'COD' ? 'COD' : order.paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-600">{order.city || '-'}</td>

                      <td className="px-6 py-4">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={isUpdating}
                          className={`px-3 py-1 rounded-md font-bold text-[10px] border-0 focus:outline-none cursor-pointer transition-colors appearance-none ${
                            ['DELIVERED', 'COMPLETED'].includes(order.orderStatus) ? 'bg-emerald-50 text-emerald-700' :
                            ['CANCELLED', 'RETURNED'].includes(order.orderStatus) ? 'bg-rose-50 text-rose-700' :
                            order.orderStatus === 'PROCESSING' ? 'bg-blue-50 text-blue-700' :
                            order.orderStatus === 'SHIPPED' ? 'bg-violet-50 text-violet-700' :
                            order.orderStatus === 'READY_TO_SHIP' ? 'bg-sky-50 text-sky-700' :
                            'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <option value="PENDING">New (Pending)</option>
                          <option value="ON_HOLD">On Hold</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="READY_TO_SHIP">Ready to Ship</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="RETURNED">Returned</option>
                        </select>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenRowMenuId((id) => (id === order.id ? null : order.id))}
                              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openRowMenuId === order.id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedInvoiceOrder(order)}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedThermalOrder(order)}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Tag className="w-3.5 h-3.5" /> Print Label
                                </button>
                                {onDispatchCourierClick && (
                                  <button
                                    type="button"
                                    onClick={() => onDispatchCourierClick(order)}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Truck className="w-3.5 h-3.5" /> Dispatch
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {orders.length > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
            <div>
              Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} orders
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateUrlParams({ page: (meta.page - 1).toString() })}
                disabled={meta.page <= 1 || isFetching}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg">
                Page {meta.page} of {meta.totalPages || 1}
              </div>

              <button
                onClick={() => updateUrlParams({ page: (meta.page + 1).toString() })}
                disabled={meta.page >= meta.totalPages || isFetching}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      <OrderDetailPanel
        order={previewOrder}
        onClose={() => setPreviewOrderId(null)}
        onConfirm={handlePanelConfirm}
        onBookCourier={onDispatchCourierClick}
        isConfirming={isUpdating}
      />
    </div>
  );
}
