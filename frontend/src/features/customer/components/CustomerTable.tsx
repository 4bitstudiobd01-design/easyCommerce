'use client';

import React, { useState } from 'react';
import { Customer } from '../api/customerApi';
import { getOriginLabel } from '../utils/origin';
import { MoreVertical, Eye, Edit2, UserCheck, UserX, ShieldAlert, ShieldCheck, ArrowUp, ArrowDown, ArrowUpDown, SearchX, RefreshCw } from 'lucide-react';

interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
  onSelectCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onToggleStatus: (customer: Customer) => void;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (id: string, checked: boolean) => void;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  onSortChange?: (field: string) => void;
  searchQuery?: string;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function CustomerTable({
  customers,
  isLoading,
  onSelectCustomer,
  onEditCustomer,
  onToggleStatus,
  selectedIds,
  onSelectAll,
  onSelectRow,
  sortBy = 'createdAt',
  sortOrder = 'DESC',
  onSortChange,
  searchQuery,
  hasActiveFilters,
  onClearFilters,
}: CustomerTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const allSelected = customers.length > 0 && selectedIds.length === customers.length;

  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${f}${l}` || 'C';
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return <span className="text-slate-400 font-normal">No orders</span>;
    const date = new Date(isoString);
    return (
      <div>
        <span className="font-semibold text-slate-800 text-xs block">
          {date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
        </span>
        <span className="text-[11px] text-slate-400">
          {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    );
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors inline ml-1" />;
    }
    return sortOrder === 'ASC' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 font-bold inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 font-bold inline ml-1" />
    );
  };

  // Lets screen readers announce the current sort column and direction, which the
  // icon alone conveys only visually.
  const ariaSortFor = (field: string): 'ascending' | 'descending' | 'none' => {
    if (sortBy !== field) return 'none';
    return sortOrder === 'ASC' ? 'ascending' : 'descending';
  };

  const sortLabelFor = (field: string, label: string) => {
    if (sortBy !== field) return `Sort by ${label}`;
    return `Sort by ${label}, currently ${sortOrder === 'ASC' ? 'ascending' : 'descending'}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-full bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto my-6">
        <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base text-slate-900">
          {searchQuery ? 'No Matching Customers Found' : 'No Customers Found'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {searchQuery
            ? `No customer records matched "${searchQuery}". Try checking for typos or searching by phone number.`
            : 'No customers match the active status/source/date filter criteria.'}
        </p>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  aria-label="Select all customers on page"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </th>

              {/* Customer Name Header */}
              <th className="py-3.5 px-4 min-w-[200px]" aria-sort={ariaSortFor('firstName')}>
                <button
                  onClick={() => onSortChange?.('firstName')}
                  aria-label={sortLabelFor('firstName', 'Customer')}
                  className="group flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none"
                >
                  <span>Customer</span>
                  {renderSortIcon('firstName')}
                </button>
              </th>

              {/* Phone Header — hidden on small screens; phone is also shown under the name */}
              <th className="hidden md:table-cell py-3.5 px-4 min-w-[130px]">Phone</th>

              {/* Origin Header — where the customer's registration/first touch came from (Facebook, TikTok, direct, etc) */}
              <th className="hidden lg:table-cell py-3.5 px-4 min-w-[110px]">Origin</th>

              {/* Orders Header */}
              <th className="py-3.5 px-4 text-center min-w-[90px]" aria-sort={ariaSortFor('ordersCount')}>
                <button
                  onClick={() => onSortChange?.('ordersCount')}
                  aria-label={sortLabelFor('ordersCount', 'Orders')}
                  className="group inline-flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none"
                >
                  <span>Orders</span>
                  {renderSortIcon('ordersCount')}
                </button>
              </th>

              {/* Total Spent Header */}
              <th className="py-3.5 px-4 min-w-[120px]" aria-sort={ariaSortFor('totalSpent')}>
                <button
                  onClick={() => onSortChange?.('totalSpent')}
                  aria-label={sortLabelFor('totalSpent', 'Total Spent')}
                  className="group flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none"
                >
                  <span>Total Spent</span>
                  {renderSortIcon('totalSpent')}
                </button>
              </th>

              {/* Last Order Header */}
              <th className="hidden lg:table-cell py-3.5 px-4 min-w-[140px]" aria-sort={ariaSortFor('lastOrderAt')}>
                <button
                  onClick={() => onSortChange?.('lastOrderAt')}
                  aria-label={sortLabelFor('lastOrderAt', 'Last Order')}
                  className="group flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none"
                >
                  <span>Last Order</span>
                  {renderSortIcon('lastOrderAt')}
                </button>
              </th>

              {/* Status Header */}
              <th className="py-3.5 px-4 min-w-[100px]">Status</th>

              {/* Created Header */}
              <th className="hidden xl:table-cell py-3.5 px-4 min-w-[110px]" aria-sort={ariaSortFor('createdAt')}>
                <button
                  onClick={() => onSortChange?.('createdAt')}
                  aria-label={sortLabelFor('createdAt', 'Created')}
                  className="group flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-none"
                >
                  <span>Created</span>
                  {renderSortIcon('createdAt')}
                </button>
              </th>

              {/* Actions Header */}
              <th className="py-3.5 px-4 text-right w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {customers.map((customer) => {
              const isSelected = selectedIds.includes(customer.id);
              const initials = getInitials(customer.firstName, customer.lastName);

              return (
                <tr
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer)}
                  className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/60' : ''
                  }`}
                >
                  {/* 1. Checkbox */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectRow(customer.id, e.target.checked)}
                      aria-label={`Select ${customer.firstName} ${customer.lastName}`}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </td>

                  {/* 2. Customer Avatar + Name + Email */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center border border-blue-200 shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs block truncate hover:text-blue-600 transition-colors">
                          {customer.firstName} {customer.lastName}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {customer.email || 'No email provided'}
                        </span>
                        {/* Phone has its own column from md up; surface it here below that. */}
                        <span className="md:hidden text-[11px] text-slate-500 block truncate">
                          {customer.phone}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 3. Phone */}
                  <td className="hidden md:table-cell py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {customer.phone}
                  </td>

                  {/* 3c. Origin — Facebook/TikTok/Instagram/etc, from registration attribution */}
                  <td className="hidden lg:table-cell py-3.5 px-4 whitespace-nowrap">
                    {getOriginLabel(customer) ? (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-lg text-[10px]">
                        {getOriginLabel(customer)}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[11px]">—</span>
                    )}
                  </td>

                  {/* 4. Orders */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs">
                      {customer.ordersCount ?? 0}
                    </span>
                  </td>

                  {/* 5. Total Spent */}
                  <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                    ৳{(customer.totalSpent ?? 0).toLocaleString()}
                  </td>

                  {/* 6. Last Order */}
                  <td className="hidden lg:table-cell py-3.5 px-4 whitespace-nowrap">
                    {formatDateTime(customer.lastOrderAt)}
                  </td>

                  {/* 7. Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {customer.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : customer.status === 'BLOCKED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* 8. Created */}
                  <td className="hidden xl:table-cell py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatDate(customer.createdAt)}
                  </td>

                  {/* 9. Actions Menu */}
                  <td className="py-3.5 px-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === customer.id ? null : customer.id)}
                      aria-label="Open action menu"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuId === customer.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-4 top-10 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 text-left">
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              onSelectCustomer(customer);
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            View Details
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              onEditCustomer(customer);
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                            Edit Profile
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              onToggleStatus(customer);
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            {customer.status === 'BLOCKED' ? (
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
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
