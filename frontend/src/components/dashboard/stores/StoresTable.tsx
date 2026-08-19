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
  Store,
  ShieldAlert,
  Globe,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { StoreRecord } from './types';

interface StoresTableProps {
  stores: StoreRecord[];
  onViewDetails: (store: StoreRecord) => void;
  onEditStore?: (store: StoreRecord) => void;
  onDeleteStore?: (store: StoreRecord) => void;
}

export function StoresTable({
  stores,
  onViewDetails,
  onEditStore,
  onDeleteStore,
}: StoresTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(stores.map((s) => s.id));
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

  const renderPlanBadge = (plan: StoreRecord['plan']) => {
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

  const renderStatus = (status: StoreRecord['status']) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 text-[12px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'Trial':
        return (
          <span className="inline-flex items-center gap-1.5 text-amber-500 text-[12px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Trial
          </span>
        );
      case 'Suspended':
        return (
          <span className="inline-flex items-center gap-1.5 text-rose-600 text-[12px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Suspended
          </span>
        );
      case 'Blocked':
        return (
          <span className="inline-flex items-center gap-1.5 text-rose-600 text-[12px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Blocked
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
        <table className="w-full text-left border-collapse min-w-[1100px]">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 pl-4 pr-2 w-10 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all stores"
                  checked={
                    stores.length > 0 && selectedIds.length === stores.length
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-3 min-w-[200px]">Store</th>
              <th className="py-3.5 px-3 min-w-[180px]">Merchant</th>
              <th className="py-3.5 px-3 min-w-[190px]">Domain / Subdomain</th>
              <th className="py-3.5 px-3 text-center w-28">Plan</th>
              <th className="py-3.5 px-3 text-center w-28">Status</th>
              <th className="py-3.5 px-3 text-center w-20">Country</th>
              <th className="py-3.5 px-3 min-w-[120px]">
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
                  <span>Orders (30d)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 min-w-[130px]">
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
                  <span>Revenue (30d)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 min-w-[130px]">Created At</th>
              <th className="py-3.5 pr-4 pl-2 text-center w-24">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-xs">
            {stores.map((s) => {
              const isSelected = selectedIds.includes(s.id);

              return (
                <tr
                  key={s.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isSelected ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  {/* 1. Checkbox */}
                  <td className="py-3.5 pl-4 pr-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Select ${s.name}`}
                      checked={isSelected}
                      onChange={() => handleSelectOne(s.id)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>

                  {/* 2. Store Info */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar Circle with initials */}
                      <div
                        className={`w-9 h-9 rounded-full ${s.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        {s.initials}
                      </div>

                      <div className="min-w-0">
                        <span className="text-[13px] font-semibold text-slate-900 block leading-tight truncate">
                          {s.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">
                          ID: {s.codeId}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 3. Merchant Contact */}
                  <td className="py-3.5 px-3">
                    <div className="min-w-0 leading-snug">
                      <span className="text-[12px] font-medium text-slate-800 block truncate">
                        {s.merchant.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">
                        {s.merchant.email}
                      </span>
                    </div>
                  </td>

                  {/* 4. Domain / Subdomain */}
                  <td className="py-3.5 px-3">
                    <a
                      href={`https://${s.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-slate-600 font-normal hover:text-emerald-600 flex items-center gap-1 transition-colors truncate"
                    >
                      <span className="truncate">{s.domain}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                    </a>
                  </td>

                  {/* 5. Plan */}
                  <td className="py-3.5 px-3 text-center">
                    {renderPlanBadge(s.plan)}
                  </td>

                  {/* 6. Status */}
                  <td className="py-3.5 px-3 text-center">
                    {renderStatus(s.status)}
                  </td>

                  {/* 7. Country */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Bangladesh Flag representation */}
                      <span className="inline-block w-4 h-3 rounded-[2px] bg-[#006A4E] relative overflow-hidden shrink-0 shadow-2xs">
                        <span className="absolute top-1/2 left-[42%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F42A41]" />
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {s.country.code}
                      </span>
                    </div>
                  </td>

                  {/* 8. Orders (30d) */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[13px] font-semibold text-slate-900 block">
                        {s.orders30d.count}
                      </span>
                      {s.orders30d.isNeutral ? (
                        <span className="text-slate-400 text-[11px] font-normal block mt-0.5">
                          -
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-0.5 mt-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          {s.orders30d.trend}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 9. Revenue (30d) */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[13px] font-semibold text-slate-900 block">
                        {s.revenue30d.amount}
                      </span>
                      {s.revenue30d.isNeutral ? (
                        <span className="text-slate-400 text-[11px] font-normal block mt-0.5">
                          -
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-0.5 mt-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          {s.revenue30d.trend}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 10. Created At */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[12px] font-semibold text-slate-700 block">
                        {s.createdAt.date}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                        {s.createdAt.time}
                      </span>
                    </div>
                  </td>

                  {/* 11. Actions */}
                  <td className="py-3.5 pr-4 pl-2 text-center">
                    <div className="flex items-center justify-center gap-1 relative">
                      {/* View Eye Button */}
                      <button
                        type="button"
                        onClick={() => onViewDetails(s)}
                        title="View Details"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* 3-dots Menu Button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === s.id ? null : s.id
                            )
                          }
                          title="More Actions"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === s.id && (
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
                                  onViewDetails(s);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Store Overview</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEditStore?.(s);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Domain Settings</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Suspend Store</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Block Store</span>
                              </button>

                              <div className="border-t border-slate-100 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDeleteStore?.(s);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Store</span>
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
          Showing 1 to 10 of 2,731 stores
        </span>

        {/* Center: Pagination Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous Page"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
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
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
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
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
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
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
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
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
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
            onClick={() => setCurrentPage(274)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
              currentPage === 274
                ? 'border border-emerald-500 text-emerald-600 bg-emerald-50/50 shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            274
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(274, p + 1))}
            disabled={currentPage === 274}
            aria-label="Next Page"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
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
