'use client';

import React, { useState, useMemo } from 'react';
import { Customer360, CustomerStatusType } from '../../types/crm.types';
import {
  Search,
  Filter,
  Phone,
  Mail,
  ShoppingBag,
  MoreVertical,
  Calendar,
  Sparkles,
  ArrowUpDown,
  Download,
  Upload,
  UserCheck,
  UserX,
  ShieldAlert,
  ChevronRight,
  Eye,
  MessageCircle,
  PhoneCall,
  Flame,
  BadgeCheck,
} from 'lucide-react';
import { formatCrmDate } from '../../utils/formatDate';
import { toast } from 'sonner';

interface CustomerDirectoryViewProps {
  customers: Customer360[];
  isLoading?: boolean;
  onSelectCustomer: (customer: Customer360) => void;
  onOpenAddModal: () => void;
  onOpenQuickContact?: (customer: Customer360, channel: 'WHATSAPP' | 'CALL' | 'SMS') => void;
}

export const CustomerDirectoryView: React.FC<CustomerDirectoryViewProps> = ({
  customers,
  isLoading = false,
  onSelectCustomer,
  onOpenAddModal,
  onOpenQuickContact,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CustomerStatusType>('ALL');
  const [rfmFilter, setRfmFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'spent' | 'orders' | 'recent' | 'name'>('spent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
        if (sortBy === 'spent') diff = a.totalSpent - b.totalSpent;
        else if (sortBy === 'orders') diff = a.ordersCount - b.ordersCount;
        else if (sortBy === 'name') diff = a.fullName.localeCompare(b.fullName);
        else if (sortBy === 'recent') {
          const dateA = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
          const dateB = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
          diff = dateA - dateB;
        }
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [customers, search, statusFilter, rfmFilter, sortBy, sortOrder]);

  const handleExportCsv = () => {
    const headers = ['Full Name', 'Phone', 'Email', 'City', 'Status', 'Total Orders', 'Total Spent (BDT)', 'Segment'];
    const rows = filteredCustomers.map((c) => [
      `"${c.fullName}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      `"${c.city || ''}"`,
      `"${c.status}"`,
      c.ordersCount,
      c.totalSpent,
      `"${c.rfmSegment || ''}"`,
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
    <div className="space-y-6">
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

        {/* Filters Group */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30 transition-all"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Profiles</option>
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

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30 transition-all"
          >
            <option value="spent">Sort: Total Spent</option>
            <option value="orders">Sort: Order Count</option>
            <option value="recent">Sort: Last Purchase</option>
            <option value="name">Sort: Customer Name</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportCsv}
            className="p-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Customer 360°</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Segment / Tags</th>
                <th className="py-3.5 px-4">Orders</th>
                <th className="py-3.5 px-4">Total Spent</th>
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <p className="font-semibold text-sm">No customers matching your search</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => onSelectCustomer(customer)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    {/* Customer 360 info */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                          {customer.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {customer.fullName}
                            </span>
                            {customer.status === 'BLOCKED' && (
                              <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[9px] font-bold">
                                Blocked
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {customer.city || 'Dhaka, BD'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]">{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Segment / Tags */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {getRfmBadge(customer.rfmSegment)}
                        {customer.tags?.slice(0, 1).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Orders count */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        <span>{customer.ordersCount}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        AOV: ৳{customer.avgOrderValue.toLocaleString()}
                      </span>
                    </td>

                    {/* Total spent */}
                    <td className="py-4 px-4">
                      <span className="font-extrabold text-slate-900 text-[13px]">
                        ৳{customer.totalSpent.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Lifetime</span>
                    </td>

                    {/* Last active */}
                    <td className="py-4 px-4">
                      <span className="text-slate-600 font-medium text-xs">
                        {customer.lastOrderAt
                          ? formatCrmDate(customer.lastOrderAt)
                          : 'No orders yet'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {onOpenQuickContact && (
                          <>
                            <button
                              onClick={() => onOpenQuickContact(customer, 'WHATSAPP')}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                              title="Send WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenQuickContact(customer, 'CALL')}
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                              title="Call Customer"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onSelectCustomer(customer)}
                          className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200/80 rounded-lg transition-all"
                          title="View 360° Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-2">
          <span>
            Showing <strong className="text-slate-900">{filteredCustomers.length}</strong> of{' '}
            <strong className="text-slate-900">{customers.length}</strong> total customer profiles
          </span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Real-time Tenant Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
