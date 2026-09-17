'use client';

import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, Clock, AlertCircle, Filter, Eye } from 'lucide-react';
import {
  useGetRequisitionsQuery,
  useGetTransfersQuery,
  useApproveRequisitionMutation,
  useRejectRequisitionMutation,
} from '@/features/finance/api/financeApi';
import { ApproveRequisitionModal } from '@/features/finance/components/ApproveRequisitionModal';
import { RejectRequisitionModal } from '@/features/finance/components/RejectRequisitionModal';
import { RequisitionDetailModal } from '@/features/finance/components/RequisitionDetailModal';

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type ApprovalItem = {
  id: string;
  type: 'REQUISITION' | 'TRANSFER';
  reference: string;
  requestedBy: string;
  department: string;
  amount: number;
  date: string;
  status: string;
  purpose?: string;
  raw: any;
};

export function FinanceApprovalsView() {
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null);
  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);

  const { data: reqData, isLoading: reqLoading } = useGetRequisitionsQuery({ status: filterStatus !== 'ALL' ? filterStatus : undefined } as any);
  const { data: transferData } = useGetTransfersQuery(undefined);

  const requisitions = (reqData as any)?.requisitions ?? (reqData as any)?.data ?? [];
  const transfers = (transferData as any)?.transfers ?? (transferData as any)?.data ?? [];

  // Build unified approval items
  const approvalItems: ApprovalItem[] = [
    ...requisitions.map((req: any) => ({
      id: req.id,
      type: 'REQUISITION' as const,
      reference: req.requisitionNumber ?? req.id.slice(0, 8).toUpperCase(),
      requestedBy: req.requesterName ?? req.requestedBy ?? 'Staff',
      department: req.department ?? '—',
      amount: Number(req.amount ?? 0),
      date: req.requestedAt ?? req.createdAt ?? '',
      status: req.status ?? 'PENDING',
      purpose: req.purpose,
      raw: req,
    })),
    ...transfers
      .filter((t: any) => filterStatus === 'ALL' || t.status === filterStatus || (filterStatus === 'PENDING' && t.status === 'COMPLETED'))
      .map((t: any) => ({
        id: t.id,
        type: 'TRANSFER' as const,
        reference: t.transferNumber ?? t.id.slice(0, 8).toUpperCase(),
        requestedBy: t.initiatedBy ?? t.createdByName ?? 'Finance',
        department: 'Finance',
        amount: Number(t.amount ?? 0),
        date: t.transferDate ?? t.createdAt ?? '',
        status: t.status ?? 'COMPLETED',
        purpose: t.note ?? t.description,
        raw: t,
      })),
  ];

  const pendingCount = approvalItems.filter((a) => a.status === 'PENDING').length;
  const approvedCount = approvalItems.filter((a) => ['APPROVED', 'COMPLETED'].includes(a.status)).length;
  const rejectedCount = approvalItems.filter((a) => a.status === 'REJECTED').length;

  const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
    PENDING: { color: 'bg-amber-100 text-amber-700', icon: Clock },
    UNDER_REVIEW: { color: 'bg-blue-100 text-blue-700', icon: Eye },
    APPROVED: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    COMPLETED: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    REJECTED: { color: 'bg-rose-100 text-rose-700', icon: XCircle },
    CANCELLED: { color: 'bg-slate-100 text-slate-600', icon: XCircle },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Finance Approvals</h1>
          <p className="text-sm text-slate-500 mt-0.5">Centralized approval center for all financial actions</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-200 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              {pendingCount} pending
            </span>
          )}
        </div>
      </div>

      {/* Summary Tabs */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilterStatus('PENDING')}
          className={`p-4 rounded-xl border text-left transition-all ${filterStatus === 'PENDING' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
        >
          <p className="text-xs font-semibold text-slate-500 mb-1">Pending</p>
          <p className="text-2xl font-extrabold text-amber-600">{pendingCount}</p>
        </button>
        <button
          onClick={() => setFilterStatus('APPROVED')}
          className={`p-4 rounded-xl border text-left transition-all ${filterStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
        >
          <p className="text-xs font-semibold text-slate-500 mb-1">Approved</p>
          <p className="text-2xl font-extrabold text-emerald-600">{approvedCount}</p>
        </button>
        <button
          onClick={() => setFilterStatus('REJECTED')}
          className={`p-4 rounded-xl border text-left transition-all ${filterStatus === 'REJECTED' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200/80 hover:border-slate-300'}`}
        >
          <p className="text-xs font-semibold text-slate-500 mb-1">Rejected</p>
          <p className="text-2xl font-extrabold text-rose-600">{rejectedCount}</p>
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            {filterStatus === 'ALL' ? 'All Items' : filterStatus} Approvals
          </h3>
          <ClipboardCheck className="w-4 h-4 text-slate-400" />
        </div>

        {reqLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : approvalItems.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No items found</p>
            <p className="text-xs text-slate-400 mt-1">No {filterStatus.toLowerCase()} approval items</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Requested By</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {approvalItems.map((item) => {
                  const cfg = statusConfig[item.status] ?? { color: 'bg-slate-100 text-slate-600', icon: Clock };
                  const StatusIcon = cfg.icon;
                  const isPending = item.status === 'PENDING';
                  return (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.type === 'REQUISITION' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.type === 'REQUISITION' ? 'Requisition' : 'Transfer'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700">{item.reference}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.requestedBy}</td>
                      <td className="px-4 py-3 text-slate-600">{item.department}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{formatMoney(item.amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{item.date ? new Date(item.date).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedRequisition(item.raw)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isPending && item.type === 'REQUISITION' && (
                            <>
                              <button
                                onClick={() => setApproveTarget(item.raw)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRejectTarget(item.raw)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedRequisition && (
        <RequisitionDetailModal
          isOpen={true}
          requisition={selectedRequisition}
          onClose={() => setSelectedRequisition(null)}
        />
      )}
      {approveTarget && (
        <ApproveRequisitionModal
          isOpen={true}
          requisition={approveTarget}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {rejectTarget && (
        <RejectRequisitionModal
          isOpen={true}
          requisition={rejectTarget}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
