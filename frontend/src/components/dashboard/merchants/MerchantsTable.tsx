'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  ArrowUpDown,
  ArrowUpRight,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  UserCheck,
  Building2,
  Trash2,
} from 'lucide-react';
import { MerchantRecord } from './types';

interface MerchantsTableProps {
  merchants: MerchantRecord[];
  onViewDetails: (merchant: MerchantRecord) => void;
  onEditMerchant?: (merchant: MerchantRecord) => void;
  onDeleteMerchant?: (merchant: MerchantRecord) => void;
}

export function MerchantsTable({
  merchants,
  onViewDetails,
  onEditMerchant,
  onDeleteMerchant,
}: MerchantsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(merchants.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const renderPlanBadge = (plan: MerchantRecord['plan']) => {
    switch (plan) {
      case 'Business':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            Business
          </span>
        );
      case 'Growth':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            Growth
          </span>
        );
      case 'Starter':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Starter
          </span>
        );
      case 'Enterprise':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Enterprise
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {plan}
          </span>
        );
    }
  };

  const renderStatusBadge = (status: MerchantRecord['status']) => {
    switch (status) {
      case 'Active':
        return (
          <span className="text-emerald-600 text-[12px] font-semibold">
            Active
          </span>
        );
      case 'Trial':
        return (
          <span className="text-amber-500 text-[12px] font-semibold">
            Trial
          </span>
        );
      case 'Suspended':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
            Suspended
          </span>
        );
      case 'Churned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Churned
          </span>
        );
      default:
        return <span className="text-slate-600 text-xs">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
      {/* Responsive Table Container */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse min-w-[1050px]">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 pl-4 pr-2 w-10 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all merchants"
                  checked={
                    merchants.length > 0 &&
                    selectedIds.length === merchants.length
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-3 min-w-[200px]">Merchant</th>
              <th className="py-3.5 px-3 min-w-[180px]">Contact</th>
              <th className="py-3.5 px-3 text-center w-20">Stores</th>
              <th className="py-3.5 px-3 text-center w-28">Plan</th>
              <th className="py-3.5 px-3 text-center w-28">Status</th>
              <th className="py-3.5 px-3 min-w-[130px]">
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
                  <span>Joined At</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 min-w-[130px]">Revenue (30d)</th>
              <th className="py-3.5 px-3 min-w-[110px]">Orders (30d)</th>
              <th className="py-3.5 px-3 min-w-[100px]">MRR</th>
              <th className="py-3.5 pr-4 pl-2 text-center w-24">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-xs">
            {merchants.map((m) => {
              const isSelected = selectedIds.includes(m.id);

              return (
                <tr
                  key={m.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isSelected ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  {/* 1. Checkbox */}
                  <td className="py-3.5 pl-4 pr-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Select ${m.name}`}
                      checked={isSelected}
                      onChange={() => handleSelectOne(m.id)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>

                  {/* 2. Merchant Info */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar Circle with initials */}
                      <div
                        className={`w-9 h-9 rounded-full ${m.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        {m.initials}
                      </div>

                      <div className="min-w-0">
                        <span className="text-[13px] font-semibold text-slate-900 block leading-tight truncate">
                          {m.name}
                        </span>
                        <a
                          href={`https://${m.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-slate-400 font-normal hover:text-emerald-600 flex items-center gap-0.5 mt-0.5 transition-colors truncate"
                        >
                          <span>{m.domain}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                        </a>
                      </div>
                    </div>
                  </td>

                  {/* 3. Contact Info */}
                  <td className="py-3.5 px-3">
                    <div className="min-w-0 leading-snug">
                      <span className="text-[12px] font-medium text-slate-800 block truncate">
                        {m.contact.email}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">
                        {m.contact.phone}
                      </span>
                    </div>
                  </td>

                  {/* 4. Stores Count */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="text-[13px] font-medium text-slate-700">
                      {m.stores}
                    </span>
                  </td>

                  {/* 5. Plan */}
                  <td className="py-3.5 px-3 text-center">
                    {renderPlanBadge(m.plan)}
                  </td>

                  {/* 6. Status */}
                  <td className="py-3.5 px-3 text-center">
                    {renderStatusBadge(m.status)}
                  </td>

                  {/* 7. Joined At */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[12px] font-semibold text-slate-700 block">
                        {m.joinedAt.date}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                        {m.joinedAt.time}
                      </span>
                    </div>
                  </td>

                  {/* 8. Revenue (30d) */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[13px] font-semibold text-slate-900 block">
                        {m.revenue30d.amount}
                      </span>
                      {m.revenue30d.isNeutral ? (
                        <span className="text-slate-400 text-[11px] font-normal block mt-0.5">
                          -
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-0.5 mt-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          {m.revenue30d.trend}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 9. Orders (30d) */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[13px] font-semibold text-slate-900 block">
                        {m.orders30d.amount}
                      </span>
                      {m.orders30d.isNeutral ? (
                        <span className="text-slate-400 text-[11px] font-normal block mt-0.5">
                          -
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-0.5 mt-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          {m.orders30d.trend}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 10. MRR */}
                  <td className="py-3.5 px-3">
                    <span className="text-[13px] font-semibold text-slate-900">
                      {m.mrr}
                    </span>
                  </td>

                  {/* 11. Actions */}
                  <td className="py-3.5 pr-4 pl-2 text-center">
                    <div className="flex items-center justify-center gap-1 relative">
                      {/* View Eye Button */}
                      <button
                        type="button"
                        onClick={() => onViewDetails(m)}
                        title="View Details"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* 3-dots Menu Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === m.id ? null : m.id
                            )
                          }
                          title="More Actions"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === m.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-left animate-in fade-in zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onViewDetails(m);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Profile</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEditMerchant?.(m);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>Manage Stores</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Login as Merchant</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Suspend Account</span>
                              </button>

                              <div className="border-t border-slate-100 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDeleteMerchant?.(m);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Merchant</span>
                              </button>
                            </div>
                          </>
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

      {/* Table Pagination Footer */}
      <div className="p-3.5 sm:p-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 bg-white">
        {/* Left: Total Count Info */}
        <span className="text-xs text-slate-500 font-medium">
          Showing 1 to 10 of 2,548 merchants
        </span>

        {/* Center: Pagination Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous Page"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
              currentPage === 1
                ? 'border border-emerald-500 text-emerald-600 bg-emerald-50/50 shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            1
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(2)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
              currentPage === 2
                ? 'border border-emerald-500 text-emerald-600 bg-emerald-50/50 shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            2
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(3)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
              currentPage === 3
                ? 'border border-emerald-500 text-emerald-600 bg-emerald-50/50 shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            3
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(4)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
              currentPage === 4
                ? 'border border-emerald-500 text-emerald-600 bg-emerald-50/50 shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            4
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(5)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
              currentPage === 5
                ? 'border border-emerald-500 text-emerald-600 bg-emerald-50/50 shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            5
          </button>

          <span className="text-slate-400 text-xs px-1 select-none">...</span>

          <button
            type="button"
            onClick={() => setCurrentPage(255)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
              currentPage === 255
                ? 'border border-emerald-500 text-emerald-600 bg-emerald-50/50 shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            255
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(255, p + 1))}
            disabled={currentPage === 255}
            aria-label="Next Page"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Rows per page</span>
          <div className="relative">
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(e.target.value)}
              aria-label="Rows per page"
              className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-7 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
