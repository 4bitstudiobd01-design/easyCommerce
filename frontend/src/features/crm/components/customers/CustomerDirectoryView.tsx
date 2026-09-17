'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Customer360, CustomerStatusType } from '../../types/crm.types';
import {
  Search,
  Download,
  Upload,
  UserCheck,
  UserX,
  ShieldAlert,
  ShieldCheck,
  Eye,
  MessageCircle,
  PhoneCall,
  Sparkles,
  BadgeCheck,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  X,
  RefreshCw,
  Phone,
  Mail,
  ShoppingBag,
} from 'lucide-react';
import { CrmPagination } from '../CrmPagination';
import { formatCrmDate } from '../../utils/formatDate';
import { getOriginLabel } from '@/features/customer/utils/origin';
import { FraudRiskBadge } from '@/features/customer/components/FraudRiskBadge';
import { toast } from 'sonner';

interface CustomerDirectoryViewProps {
  customers: Customer360[];
  isLoading?: boolean;
  onSelectCustomer: (customer: Customer360) => void;
  onOpenAddModal: () => void;
  onOpenImportModal?: () => void;
  onEditCustomer?: (customer: Customer360) => void;
  onToggleStatus?: (customer: Customer360) => void;
  onBulkUpdateStatus?: (customerIds: string[], status: 'ACTIVE' | 'BLOCKED') => void;
  onOpenQuickContact?: (customer: Customer360, channel: 'WHATSAPP' | 'CALL' | 'SMS') => void;
}

export const CustomerDirectoryView: React.FC<CustomerDirectoryViewProps> = ({
  customers,
  isLoading = false,
  onSelectCustomer,
  onOpenAddModal,
  onOpenImportModal,
  onEditCustomer,
  onToggleStatus,
  onBulkUpdateStatus,
  onOpenQuickContact,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CustomerStatusType>('ALL');
  const [rfmFilter, setRfmFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'spent' | 'orders' | 'recent' | 'name' | 'createdAt'>('spent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Multi-select & Bulk actions state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filter & Sort Logic
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const matchesSearch =
          c.fullName.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
          (c.city && c.city.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        const matchesRfm = rfmFilter === 'ALL' || c.rfmSegment === rfmFilter;

        return matchesSearch && matchesStatus && matchesRfm;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'spent') diff = (a.totalSpent || 0) - (b.totalSpent || 0);
        else if (sortBy === 'orders') diff = (a.ordersCount || 0) - (b.ordersCount || 0);
        else if (sortBy === 'name') diff = a.fullName.localeCompare(b.fullName);
        else if (sortBy === 'recent') {
          const dateA = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
          const dateB = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
          diff = dateA - dateB;
        } else if (sortBy === 'createdAt') {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          diff = dateA - dateB;
        }
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [customers, search, statusFilter, rfmFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, rfmFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Checkbox handlers
  const allOnPageSelected =
    paginatedCustomers.length > 0 &&
    paginatedCustomers.every((c) => selectedIds.includes(c.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedCustomers.map((c) => c.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIdsSet = new Set(paginatedCustomers.map((c) => c.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIdsSet.has(id)));
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleHeaderSort = (field: 'spent' | 'orders' | 'recent' | 'name' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (field: 'spent' | 'orders' | 'recent' | 'name' | 'createdAt') => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 font-bold inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 font-bold inline ml-1" />
    );
  };

  const handleExportCsv = () => {
    const headers = ['Full Name', 'Phone', 'Email', 'City', 'Status', 'Total Orders', 'Total Spent (BDT)', 'Segment', 'Origin'];
    const rows = filteredCustomers.map((c) => [
      `"${c.fullName}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      `"${c.city || ''}"`,
      `"${c.status}"`,
      c.ordersCount,
      c.totalSpent,
      `"${c.rfmSegment || ''}"`,
      `"${getOriginLabel(c) || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_crm_export_${formatCrmDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Customer directory exported successfully!');
  };

  const getRfmBadge = (segment?: string) => {
    switch (segment) {
      case 'VIP':
        return (
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/60 rounded-md text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600" /> VIP
          </span>
        );
      case 'LOYAL':
        return (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-md text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
            <BadgeCheck className="w-3 h-3 text-blue-600" /> Loyal
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-md text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-600" /> At-Risk
          </span>
        );
      case 'NEW':
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
            First-Time
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium">
            Regular
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone (+880...), email, or city..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Filters & Action Tools */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30 transition-all"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Registered Members</option>
            <option value="GUEST">Guest Orders</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked / Flagged</option>
          </select>

          {/* RFM Segment Filter */}
          <select
            value={rfmFilter}
            onChange={(e) => setRfmFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30 transition-all"
          >
            <option value="ALL">All Segments</option>
            <option value="VIP">🌟 VIP Spenders</option>
            <option value="LOYAL">🔁 Loyal Repeat</option>
            <option value="AT_RISK">⚠️ At-Risk</option>
            <option value="NEW">🆕 First-Time</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30 transition-all"
          >
            <option value="spent">Sort: Total Spent</option>
            <option value="orders">Sort: Order Count</option>
            <option value="recent">Sort: Last Purchase</option>
            <option value="name">Sort: Customer Name</option>
            <option value="createdAt">Sort: Created Date</option>
          </select>

          {/* Import CSV Button */}
          {onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border border-blue-200/60"
              title="Import Customers from CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border border-slate-200"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Floating Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-extrabold shadow-sm">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {selectedIds.length === 1 ? 'customer selected' : 'customers selected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onBulkUpdateStatus && (
              <>
                <button
                  onClick={() => onBulkUpdateStatus(selectedIds, 'BLOCKED')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Block Selected</span>
                </button>
                <button
                  onClick={() => onBulkUpdateStatus(selectedIds, 'ACTIVE')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Activate Selected</span>
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Customers Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all customers on page"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 min-w-[220px]">
                  <button
                    onClick={() => handleHeaderSort('name')}
                    className="group flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none"
                  >
                    <span>Customer 360°</span>
                    {renderSortIcon('name')}
                  </button>
                </th>
                <th className="hidden lg:table-cell py-3.5 px-4 min-w-[110px]">
                  <span>Origin</span>
                </th>
                <th className="py-3.5 px-4 min-w-[120px]">
                  <span>Segment / RFM</span>
                </th>
                <th className="py-3.5 px-4 text-center min-w-[90px]">
                  <button
                    onClick={() => handleHeaderSort('orders')}
                    className="group inline-flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none"
                  >
                    <span>Orders</span>
                    {renderSortIcon('orders')}
                  </button>
                </th>
                <th className="py-3.5 px-4 min-w-[120px]">
                  <button
                    onClick={() => handleHeaderSort('spent')}
                    className="group flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none"
                  >
                    <span>Total Spent</span>
                    {renderSortIcon('spent')}
                  </button>
                </th>
                <th className="py-3.5 px-4 min-w-[140px]">
                  <button
                    onClick={() => handleHeaderSort('recent')}
                    className="group flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none"
                  >
                    <span>Last Order Date</span>
                    {renderSortIcon('recent')}
                  </button>
                </th>
                <th className="hidden xl:table-cell py-3.5 px-4 min-w-[120px]">
                  <button
                    onClick={() => handleHeaderSort('createdAt')}
                    className="group flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none"
                  >
                    <span>Created Date</span>
                    {renderSortIcon('createdAt')}
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="py-4 px-5">
                      <div className="h-10 w-full bg-slate-100 animate-pulse rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <p className="font-bold text-sm text-slate-800">No Customers Found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const originLabel = getOriginLabel(c);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCustomer(c)}
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(c.id, e.target.checked)}
                          aria-label={`Select ${c.fullName}`}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* 2. Customer 360° + Avatar + Fraud Risk Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 group-hover:from-blue-600 group-hover:to-indigo-600 transition-colors">
                            {c.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs block truncate group-hover:text-blue-600 transition-colors">
                              {c.fullName}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                              <span className="font-medium text-slate-600">{c.phone}</span>
                              {c.email && <span>· {c.email}</span>}
                            </div>
                            {/* Fraud Delivery History Badge */}
                            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                              <FraudRiskBadge
                                customerId={c.id}
                                customerLabel={`${c.fullName} · ${c.phone}`}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Marketing Origin / Attribution */}
                      <td className="hidden lg:table-cell py-3.5 px-4 whitespace-nowrap">
                        {originLabel ? (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold rounded-md text-[10px]">
                            {originLabel}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>

                      {/* 4. RFM Segment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getRfmBadge(c.rfmSegment)}
                          {c.status === 'BLOCKED' && (
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-extrabold uppercase">
                              Blocked
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Orders Count */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-slate-100 font-extrabold text-slate-800 rounded-lg text-xs">
                          {c.ordersCount || 0}
                        </span>
                      </td>

                      {/* 6. Total Spent */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 text-xs">
                          ৳{(c.totalSpent || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* 7. Last Order Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {c.lastOrderAt ? (
                          <div>
                            <span className="font-semibold text-slate-800 text-xs block">
                              {new Date(c.lastOrderAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(c.lastOrderAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-normal">No orders</span>
                        )}
                      </td>

                      {/* 8. Created Date */}
                      <td className="hidden xl:table-cell py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {c.createdAt ? (
                          new Date(c.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                          })
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* 8. Actions Menu */}
                      <td className="py-3.5 px-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Contact buttons */}
                          {onOpenQuickContact && (
                            <button
                              onClick={() => onOpenQuickContact(c, 'WHATSAPP')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* 3-dots Menu Button */}
                          <button
                            onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                            aria-label="Open action menu"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Dropdown Menu */}
                        {openMenuId === c.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-4 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-150">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onSelectCustomer(c);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                View 360° Profile
                              </button>

                              {onEditCustomer && (
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onEditCustomer(c);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                                  Edit Profile
                                </button>
                              )}

                              {onToggleStatus && (
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onToggleStatus(c);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  {c.status === 'BLOCKED' ? (
                                    <>
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      Unblock Customer
                                    </>
                                  ) : (
                                    <>
                                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                      Block Customer
                                    </>
                                  )}
                                </button>
                              )}

                              <div className="h-px bg-slate-100 my-1" />

                              {onOpenQuickContact && (
                                <>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onOpenQuickContact(c, 'WHATSAPP');
                                    }}
                                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    WhatsApp Message
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onOpenQuickContact(c, 'CALL');
                                    }}
                                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                                    Phone Call
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredCustomers.length > 0 && (
          <CrmPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredCustomers.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="customers"
          />
        )}
      </div>
    </div>
  );
};
