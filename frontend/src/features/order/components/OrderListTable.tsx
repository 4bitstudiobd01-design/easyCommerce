'use client';

import React, { useState } from 'react';
import { useGetMerchantOrdersQuery, useUpdateOrderStatusMutation, Order } from '../api/orderApi';
import { InvoiceModal } from './InvoiceModal';
import { ThermalLabelModal } from './ThermalLabelModal';
import {
  ShoppingCart,
  Phone,
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
  DollarSign,
  Users,
  Search,
  Download,
  Filter,
  ArrowUpDown,
  Eye,
  Edit2,
  ExternalLink,
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

type OrderStatusFilterType =
  | 'ALL'
  | 'PENDING'
  | 'ON_HOLD'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'PAYMENT_ON_PROCESS'
  | 'PAYMENT_FAILED';

export function OrderListTable({ onDispatchCourierClick, onCreateOrderClick }: OrderListTableProps) {
  const { data: orders = [], isLoading, refetch } = useGetMerchantOrdersQuery();
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedThermalOrder, setSelectedThermalOrder] = useState<Order | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<OrderStatusFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Calculate Metrics
  const confirmedCount = orders.filter((o) => o.orderStatus === 'CONFIRMED').length;
  const totalAmountSum = orders.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
  const uniqueCustomersCount = new Set(orders.map((o) => o.customerPhone)).size;

  const handleStatusChange = async (orderId: string, newStatus: any) => {
    try {
      await updateOrderStatus({ id: orderId, orderStatus: newStatus }).unwrap();
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update order status.');
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((item) => item !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = selectedFilter === 'ALL' || order.orderStatus === selectedFilter;

    const matchesSearch =
      !searchQuery ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  const filterPills: { id: OrderStatusFilterType; label: string; activeColor: string; textColor: string }[] = [
    { id: 'ALL', label: 'All Orders', activeColor: 'bg-slate-900 text-white', textColor: 'text-slate-700 hover:bg-slate-100' },
    { id: 'PENDING', label: 'Placed', activeColor: 'bg-purple-600 text-white', textColor: 'text-purple-600 hover:bg-purple-50' },
    { id: 'ON_HOLD', label: 'On Hold', activeColor: 'bg-amber-600 text-white', textColor: 'text-amber-600 hover:bg-amber-50' },
    { id: 'CONFIRMED', label: 'Confirmed', activeColor: 'bg-blue-600 text-white', textColor: 'text-blue-600 hover:bg-blue-50' },
    { id: 'PROCESSING', label: 'Processing', activeColor: 'bg-indigo-600 text-white', textColor: 'text-indigo-600 hover:bg-indigo-50' },
    { id: 'SHIPPED', label: 'Shipped', activeColor: 'bg-cyan-600 text-white', textColor: 'text-cyan-600 hover:bg-cyan-50' },
    { id: 'DELIVERED', label: 'Delivered', activeColor: 'bg-emerald-600 text-white', textColor: 'text-emerald-600 hover:bg-emerald-50' },
    { id: 'COMPLETED', label: 'Completed', activeColor: 'bg-green-600 text-white', textColor: 'text-green-600 hover:bg-green-50' },
    { id: 'CANCELLED', label: 'Cancelled', activeColor: 'bg-red-600 text-white', textColor: 'text-red-600 hover:bg-red-50' },
    { id: 'RETURNED', label: 'Returned', activeColor: 'bg-orange-600 text-white', textColor: 'text-orange-600 hover:bg-orange-50' },
    { id: 'PAYMENT_ON_PROCESS', label: 'Payment OnProcess', activeColor: 'bg-violet-600 text-white', textColor: 'text-violet-600 hover:bg-violet-50' },
    { id: 'PAYMENT_FAILED', label: 'Payment Failed', activeColor: 'bg-rose-600 text-white', textColor: 'text-rose-600 hover:bg-rose-50' },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="h-6 w-32 bg-slate-200 animate-pulse rounded-lg" />
          <div className="h-10 w-32 bg-slate-200 animate-pulse rounded-xl" />
        </div>
        <table className="w-full text-left text-xs">
          <tbody>
            <TableRowSkeleton columns={8} />
            <TableRowSkeleton columns={8} />
            <TableRowSkeleton columns={8} />
          </tbody>
        </table>
      </div>
    );
  }

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

      {/* 1. TOP HEADER TITLE & CREATE ORDER ACTION BUTTON */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Orders</h2>
          <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-purple-600/30">
            {orders.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onCreateOrderClick || (() => alert('Create Order feature clicked'))}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Order</span>
        </button>
      </div>

      {/* 2. TOP 4 METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Date */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100/60 text-purple-600 rounded-2xl border border-purple-200/60">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Today's date</span>
            <span className="text-base font-black text-slate-900 block mt-0.5">3rd August</span>
          </div>
        </div>

        {/* Card 2: Total Orders (Confirmed) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100/60 text-purple-600 rounded-2xl border border-purple-200/60">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Total Orders (Confirmed)</span>
            <span className="text-xl font-black text-slate-900 block mt-0.5">{confirmedCount}</span>
          </div>
        </div>

        {/* Card 3: Total Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100/60 text-purple-600 rounded-2xl border border-purple-200/60 flex items-center justify-center font-bold text-xl">
            ৳
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Total Amount</span>
            <span className="text-xl font-black text-slate-900 block mt-0.5">
              ৳{totalAmountSum.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 4: Total Customer Served */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100/60 text-purple-600 rounded-2xl border border-purple-200/60">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Total Customer Served</span>
            <span className="text-xl font-black text-slate-900 block mt-0.5">{uniqueCustomersCount}</span>
          </div>
        </div>
      </div>

      {/* 3. SEARCH BAR WITH RELOCATED TOOL BUTTONS (FILTERS, SORT, COLUMNS, EXPORT) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar with All Fields Dropdown */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative">
            <select className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer">
              <option>All Fields</option>
              <option>Order ID</option>
              <option>Phone Number</option>
              <option>Customer Name</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search with order ID or Phone number..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        {/* Relocated Tool Buttons: Filters, Sort, Columns, Export */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
          </button>

          <button
            type="button"
            className="p-2 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
            title="Sort"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <button
            type="button"
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <span>Columns</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => alert('Exporting orders to CSV...')}
            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200/80 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 4. NON-SCROLLABLE FULL WRAPPED STATUS PILLS ROW */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100/60 rounded-2xl border border-slate-200/80">
        {filterPills.map((pill) => {
          const isSelected = selectedFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSelectedFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                isSelected
                  ? `${pill.activeColor} shadow-md`
                  : `${pill.textColor} bg-white/80 border border-slate-200/60`
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* 5. ORDERS DATA TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5 font-bold">Order</th>
                <th className="px-6 py-3.5 font-bold">Customer</th>
                <th className="px-6 py-3.5 font-bold">Date</th>
                <th className="px-6 py-3.5 font-bold">Status</th>
                <th className="px-4 py-3.5 font-bold">Type</th>
                <th className="px-6 py-3.5 font-bold">Amount</th>
                <th className="px-6 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                    No orders found matching the filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isChecked = selectedOrders.includes(order.id);
                  const customerInitials = order.customerName
                    ? order.customerName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'CU';

                  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  const formattedTime = new Date(order.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-purple-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-600 cursor-pointer"
                        />
                      </td>

                      {/* Order Number & Details */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                            <Package className="w-4 h-4 text-slate-500" />
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 text-xs">
                                #{order.orderNumber}
                              </span>
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 font-bold text-[9px] rounded-md border border-blue-100">
                                Online
                              </span>
                              <button
                                onClick={() => setSelectedInvoiceOrder(order)}
                                className="text-slate-400 hover:text-purple-600"
                                title="Quick View"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              ORD-{order.orderNumber?.slice(-3)} • {order.items?.length || 1} items
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                            {customerInitials}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-xs block">
                              {order.customerName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {order.customerPhone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">
                            {formattedDate}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {formattedTime}
                          </span>
                        </div>
                      </td>

                      {/* Order Status Dropdown with All 11 Statuses */}
                      <td className="px-6 py-4">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={isUpdating}
                          className={`px-3 py-1.5 rounded-full font-extrabold text-[10px] border focus:outline-none cursor-pointer transition-colors ${
                            order.orderStatus === 'CONFIRMED'
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : order.orderStatus === 'DELIVERED' || order.orderStatus === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : order.orderStatus === 'CANCELLED' || order.orderStatus === 'PAYMENT_FAILED'
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : order.orderStatus === 'SHIPPED'
                              ? 'bg-cyan-50 text-cyan-600 border-cyan-200'
                              : order.orderStatus === 'PROCESSING'
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                              : order.orderStatus === 'RETURNED'
                              ? 'bg-orange-50 text-orange-600 border-orange-200'
                              : 'bg-amber-50 text-amber-600 border-amber-200'
                          }`}
                        >
                          <option value="PENDING">Placed (Pending)</option>
                          <option value="ON_HOLD">On Hold</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="RETURNED">Returned</option>
                          <option value="PAYMENT_ON_PROCESS">Payment OnProcess</option>
                          <option value="PAYMENT_FAILED">Payment Failed</option>
                        </select>
                      </td>

                      {/* Type (Delivery Provider) */}
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-200 flex items-center gap-1 w-fit">
                          <Printer className="w-3 h-3 text-slate-500" />
                          <span>Own</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <span className="font-black text-slate-900 text-xs">
                          ৳{Number(order.grandTotal).toFixed(2)}
                        </span>
                      </td>

                      {/* Action Icons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Invoice Print Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Thermal Label Print Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedThermalOrder(order)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Print Thermal Shipping Sticker"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          {/* Dispatch Courier Button */}
                          {onDispatchCourierClick && (
                            <button
                              type="button"
                              onClick={() => onDispatchCourierClick(order)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Dispatch via Courier"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. PAGINATION FOOTER BAR */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing 1-{filteredOrders.length} of {orders.length}</span>
            <div className="relative">
              <select className="appearance-none pl-2.5 pr-7 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none">
                <option>20</option>
                <option>50</option>
                <option>100</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
            </div>
            <span>per page</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 flex items-center gap-1 disabled:opacity-50"
              disabled
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
              1
            </span>

            <button
              type="button"
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 flex items-center gap-1 disabled:opacity-50"
              disabled
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
