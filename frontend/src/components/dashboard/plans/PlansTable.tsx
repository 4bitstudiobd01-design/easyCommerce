'use client';

import React, { useState } from 'react';
import {
  Send,
  TrendingUp,
  Briefcase,
  Crown,
  Sliders,
  ArrowUpDown,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Copy,
  Power,
  Trash2,
} from 'lucide-react';
import { PlanRecord } from './types';

interface PlansTableProps {
  plans: PlanRecord[];
  selectedPlanId: string;
  onSelectPlan: (plan: PlanRecord) => void;
  onViewDetails: (plan: PlanRecord) => void;
  onEditPlan?: (plan: PlanRecord) => void;
  onToggleStatus?: (plan: PlanRecord) => void;
  onDuplicatePlan?: (plan: PlanRecord) => void;
  onDeletePlan?: (plan: PlanRecord) => void;
}

export function PlansTable({
  plans,
  selectedPlanId,
  onSelectPlan,
  onViewDetails,
  onEditPlan,
  onToggleStatus,
  onDuplicatePlan,
  onDeletePlan,
}: PlansTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');

  const renderIcon = (type: PlanRecord['iconType'], bg: string) => {
    switch (type) {
      case 'starter':
        return (
          <div
            className={`w-9 h-9 rounded-xl ${bg} text-white flex items-center justify-center shrink-0 shadow-2xs`}
          >
            <Send className="w-4 h-4" />
          </div>
        );
      case 'growth':
        return (
          <div
            className={`w-9 h-9 rounded-xl ${bg} text-white flex items-center justify-center shrink-0 shadow-2xs`}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
        );
      case 'business':
        return (
          <div
            className={`w-9 h-9 rounded-xl ${bg} text-white flex items-center justify-center shrink-0 shadow-2xs`}
          >
            <Briefcase className="w-4 h-4" />
          </div>
        );
      case 'enterprise':
        return (
          <div
            className={`w-9 h-9 rounded-xl ${bg} text-white flex items-center justify-center shrink-0 shadow-2xs`}
          >
            <Crown className="w-4 h-4" />
          </div>
        );
      case 'custom':
        return (
          <div
            className={`w-9 h-9 rounded-xl ${bg} text-white flex items-center justify-center shrink-0 shadow-2xs`}
          >
            <Sliders className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div
            className={`w-9 h-9 rounded-xl ${bg} text-white flex items-center justify-center shrink-0 shadow-2xs`}
          >
            <Send className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
      {/* Responsive Table Container */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse min-w-[860px]">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 pl-4 pr-3 min-w-[200px]">
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
                  <span>Plan</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 min-w-[100px]">
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
                  <span>Price</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 min-w-[110px]">Billing Cycle</th>
              <th className="py-3.5 px-3 min-w-[100px]">
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
                  <span>Merchants</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 min-w-[120px]">
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
                  <span>MRR</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 text-center w-24">Status</th>
              <th className="py-3.5 px-3 min-w-[130px]">
                <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
                  <span>Created At</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 pr-4 pl-2 text-center w-20">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-xs">
            {plans.map((p) => {
              const isSelected = selectedPlanId === p.id;

              return (
                <tr
                  key={p.id}
                  onClick={() => onSelectPlan(p)}
                  className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                    isSelected ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  {/* 1. Plan Icon & Info */}
                  <td className="py-3.5 pl-4 pr-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(p);
                        }}
                        className="cursor-pointer transition-transform hover:scale-105"
                      >
                        {renderIcon(p.iconType, p.iconBg)}
                      </button>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(p);
                          }}
                          className="text-[13px] font-bold text-slate-900 hover:text-emerald-700 hover:underline block leading-tight truncate text-left cursor-pointer transition-colors"
                        >
                          {p.name}
                        </button>
                        <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">
                          {p.subtitle}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal block truncate">
                          {p.featuresCountText}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Price */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[13px] font-semibold text-slate-900 block">
                        {p.price}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                        {p.billingPeriod}
                      </span>
                    </div>
                  </td>

                  {/* 3. Billing Cycle */}
                  <td className="py-3.5 px-3">
                    <span className="text-xs font-medium text-slate-700">
                      {p.billingCycle}
                    </span>
                  </td>

                  {/* 4. Merchants */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[13px] font-semibold text-slate-900 block">
                        {p.merchantsCount}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                        {p.merchantsShare}
                      </span>
                    </div>
                  </td>

                  {/* 5. MRR */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[13px] font-semibold text-slate-900 block">
                        {p.mrr}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                        {p.mrrShare}
                      </span>
                    </div>
                  </td>

                  {/* 6. Status */}
                  <td className="py-3.5 px-3 text-center">
                    {p.status === 'Active' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* 7. Created At */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[12px] font-semibold text-slate-700 block">
                        {p.createdAt.date}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                        {p.createdAt.time}
                      </span>
                    </div>
                  </td>

                  {/* 8. Actions */}
                  <td
                    className="py-3.5 pr-4 pl-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1 relative">
                      <button
                        type="button"
                        onClick={() => onViewDetails(p)}
                        title="View Plan Details"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === p.id ? null : p.id
                            )
                          }
                          title="More Actions"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === p.id && (
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
                                  onViewDetails(p);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Plan Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEditPlan?.(p);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit Pricing & Quotas</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDuplicatePlan?.(p);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Duplicate Plan</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onToggleStatus?.(p);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>
                                  {p.status === 'Active'
                                    ? 'Deactivate Plan'
                                    : 'Activate Plan'}
                                </span>
                              </button>

                              <div className="border-t border-slate-100 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDeletePlan?.(p);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Plan</span>
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
        <span className="text-xs text-slate-500 font-medium">
          Showing 1 to 5 of 5 plans
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            aria-label="Previous Page"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="w-8 h-8 rounded-lg text-xs font-bold border border-emerald-500 text-emerald-600 bg-emerald-50/50 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
          >
            1
          </button>

          <button
            type="button"
            disabled
            aria-label="Next Page"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

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
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
