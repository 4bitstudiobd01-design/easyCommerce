'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Building2,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import {
  useGetRequisitionsQuery,
  useGetRequisitionStatsQuery,
  type FinanceRequisition,
  type FinanceRequisitionStatus,
} from '../api/financeApi';
import { CustomDropdown } from '@/features/purchase/components/CustomDropdown';
import { ApproveRequisitionModal } from './ApproveRequisitionModal';
import { RejectRequisitionModal } from './RejectRequisitionModal';
import { CreateRequisitionModal } from './CreateRequisitionModal';
import { RequisitionDetailModal } from './RequisitionDetailModal';

const money = (v: string | number) =>
  `৳ ${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function FinanceRequisitionsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<FinanceRequisition | null>(null);
  const [rejectTarget, setRejectTarget] = useState<FinanceRequisition | null>(null);
  const [detailTarget, setDetailTarget] = useState<FinanceRequisition | null>(null);

  const queryStatus =
    statusFilter === 'ALL' ? undefined : (statusFilter as FinanceRequisitionStatus);

  const { data: requisitionsData, isLoading, isFetching, refetch } = useGetRequisitionsQuery({
    search: searchTerm.trim() || undefined,
    status: queryStatus,
    page: currentPage,
    limit: perPage,
  });

  const { data: stats } = useGetRequisitionStatsQuery();

  const items = requisitionsData?.items ?? [];
  const total = requisitionsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const rangeEnd = Math.min(currentPage * perPage, total);

  const kpiCards = useMemo(
    () => [
      {
        label: 'Pending Approvals',
        icon: Clock,
        tone: 'bg-amber-50 text-amber-600',
        count: stats?.pendingCount ?? 0,
        amount: money(stats?.pendingAmount ?? 0),
        note: 'Awaiting disbursement',
      },
      {
        label: 'Approved & Disbursed',
        icon: CheckCircle2,
        tone: 'bg-emerald-50 text-emerald-600',
        count: stats?.approvedCount ?? 0,
        amount: money(stats?.approvedAmount ?? 0),
        note: 'Funds deducted',
      },
      {
        label: 'Rejected Requisitions',
        icon: XCircle,
        tone: 'bg-rose-50 text-rose-600',
        count: stats?.rejectedCount ?? 0,
        amount: '—',
      },
      {
        label: 'Total Requested',
        icon: FileCheck,
        tone: 'bg-blue-50 text-blue-600',
        count: stats?.totalRequestedCount ?? 0,
        amount: money(stats?.totalRequestedAmount ?? 0),
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-6 pb-12 text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
            <Link href="/dashboard/finance/overview" className="text-blue-600 hover:underline">
              Finance
            </Link>
            <span className="text-slate-400">›</span>
            <span className="text-slate-500">Requisitions & Approvals</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Purchase Requisitions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Review, approve, and disburse purchase orders and departmental budget requests.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpiCards.map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-3.5"
          >
            <div className={`w-10 h-10 rounded-xl ${k.tone} flex items-center justify-center shrink-0`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500">{k.label}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                {k.count}
              </h3>
              <p className="text-[11px] font-mono font-bold text-slate-700 mt-0.5">{k.amount}</p>
              {k.note && <p className="text-[9px] text-slate-400 mt-0.5">{k.note}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col xl:flex-row items-center justify-between gap-3">
        <div className="relative w-full xl:w-80">
          <input
            type="text"
            placeholder="Search req #, PO #, supplier, title..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-4 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
          <div className="min-w-[160px]">
            <CustomDropdown
              size="sm"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                {
                  value: 'PENDING',
                  label: 'Pending Approval',
                  badge: 'Pending',
                  badgeColor: 'bg-amber-50 text-amber-700',
                },
                {
                  value: 'APPROVED',
                  label: 'Approved & Disbursed',
                  badge: 'Approved',
                  badgeColor: 'bg-emerald-50 text-emerald-700',
                },
                {
                  value: 'REJECTED',
                  label: 'Rejected',
                  badge: 'Rejected',
                  badgeColor: 'bg-rose-50 text-rose-700',
                },
              ]}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Requisitions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5">REQUISITION #</th>
                <th className="px-4 py-3.5">DATE</th>
                <th className="px-4 py-3.5">BENEFICIARY / SUPPLIER</th>
                <th className="px-4 py-3.5">PURPOSE / ITEMS</th>
                <th className="px-4 py-3.5">AMOUNT</th>
                <th className="px-4 py-3.5">STATUS</th>
                <th className="px-4 py-3.5">DISBURSEMENT</th>
                <th className="px-4 py-3.5 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 bg-slate-100 rounded-sm animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-semibold text-slate-600">No requisitions found.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Purchase orders submitted for Finance approval will appear here.
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                items.map((req) => {
                  const isPending = req.status === 'PENDING';
                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      {/* Requisition # */}
                      <td className="px-4 py-4">
                        <div>
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {req.requisitionNumber}
                          </span>
                          {req.poNumber && (
                            <div className="mt-0.5">
                              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                                {req.poNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                        <div>
                          <span>{req.requestDate}</span>
                          {req.requiredDate && (
                            <p className="text-[10px] text-slate-400">
                              Due: {req.requiredDate}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Beneficiary */}
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900">
                          {req.supplierName || 'Internal Department'}
                        </span>
                      </td>

                      {/* Title / Items */}
                      <td className="px-4 py-4 max-w-[240px]">
                        <p className="truncate font-semibold text-slate-800" title={req.title}>
                          {req.title}
                        </p>
                        {req.items && req.items.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {req.items.length} line item{req.items.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {money(req.requestedAmount)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <Clock className="w-3 h-3" />
                            Pending Approval
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved & Disbursed
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Disbursement Info */}
                      <td className="px-4 py-4 text-[11px] text-slate-500 whitespace-nowrap">
                        {isApproved ? (
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {(req.paymentMethod || 'Disbursed').toLowerCase().replace('_', ' ')}
                            </span>
                            {req.paymentReference && (
                              <span className="text-[10px] font-mono text-slate-400">
                                Ref: {req.paymentReference}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not disbursed</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => setApproveTarget(req)}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                                title="Approve & Disburse"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(req)}
                                className="px-2 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold transition shadow-2xs"
                                title="Reject Requisition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setDetailTarget(req)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200/80 rounded-lg hover:border-slate-300 transition shadow-2xs"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">
            {isFetching && !isLoading
              ? 'Loading…'
              : `Showing ${rangeStart} to ${rangeEnd} of ${total} requisitions`}
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
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2 text-slate-600">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ApproveRequisitionModal
        isOpen={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        requisition={approveTarget}
        onSuccess={() => refetch()}
      />

      <RejectRequisitionModal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        requisition={rejectTarget}
        onSuccess={() => refetch()}
      />

      <CreateRequisitionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => refetch()}
      />

      <RequisitionDetailModal
        isOpen={Boolean(detailTarget)}
        onClose={() => setDetailTarget(null)}
        requisition={detailTarget}
        onApproveClick={() => setApproveTarget(detailTarget)}
        onRejectClick={() => setRejectTarget(detailTarget)}
      />
    </div>
  );
}
