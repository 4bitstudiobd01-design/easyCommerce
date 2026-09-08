'use client';

import React from 'react';
import {
  X,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Landmark,
  Building2,
  Receipt,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { type FinanceRequisition } from '../api/financeApi';

interface RequisitionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: FinanceRequisition | null;
  onApproveClick?: () => void;
  onRejectClick?: () => void;
}

export function RequisitionDetailModal({
  isOpen,
  onClose,
  requisition,
  onApproveClick,
  onRejectClick,
}: RequisitionDetailModalProps) {
  if (!isOpen || !requisition) return null;

  const isPending = requisition.status === 'PENDING';
  const isApproved = requisition.status === 'APPROVED';
  const isRejected = requisition.status === 'REJECTED';

  const amount = Number(requisition.requestedAmount || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {requisition.requisitionNumber}
                </h3>
                {isPending && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                    <Clock className="w-3 h-3" />
                    Pending Approval
                  </span>
                )}
                {isApproved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <CheckCircle2 className="w-3 h-3" />
                    Approved & Disbursed
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                    <XCircle className="w-3 h-3" />
                    Rejected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[340px] mt-0.5">
                {requisition.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Key Facts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Total Amount
              </span>
              <span className="text-sm font-mono font-black text-blue-600">
                ৳ {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Category
              </span>
              <span className="font-semibold text-slate-700 capitalize">
                {requisition.category.toLowerCase().replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Request Date
              </span>
              <span className="font-semibold text-slate-700">
                {requisition.requestDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Priority
              </span>
              <span className="font-bold text-slate-800 uppercase text-[10px]">
                {requisition.priority}
              </span>
            </div>
          </div>

          {/* Supplier & Linkage */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Beneficiary / Supplier:</span>
              <span className="font-bold text-slate-900">
                {requisition.supplierName || '—'}
              </span>
            </div>
            {requisition.poNumber && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Linked Purchase Order:</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                  {requisition.poNumber}
                </span>
              </div>
            )}
            {requisition.requiredDate && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Required By:</span>
                <span className="font-medium text-slate-700">
                  {requisition.requiredDate}
                </span>
              </div>
            )}
          </div>

          {/* Line Items */}
          {requisition.items && requisition.items.length > 0 && (
            <div className="border border-slate-200/80 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200/80 font-bold text-slate-700 text-[11px]">
                Line Items ({requisition.items.length})
              </div>
              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                {requisition.items.map((item, i) => (
                  <div key={i} className="px-3.5 py-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{item.productName}</p>
                      {item.sku && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          SKU: {item.sku}
                        </p>
                      )}
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-slate-500">
                        {item.quantity} × ৳{Number(item.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <p className="font-bold text-slate-900">
                        ৳ {Number(item.lineTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval Disbursement Audit Trail */}
          {isApproved && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Disbursement Confirmation</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-emerald-950 pt-1">
                <div>
                  <span className="text-[10px] text-emerald-700 block">Disbursed Amount</span>
                  <span className="font-mono font-bold">
                    ৳ {Number(requisition.disbursedAmount || amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block">Payment Method</span>
                  <span className="font-semibold capitalize">
                    {(requisition.paymentMethod || 'BANK_TRANSFER').toLowerCase().replace('_', ' ')}
                  </span>
                </div>
                {requisition.paymentReference && (
                  <div>
                    <span className="text-[10px] text-emerald-700 block">Reference / Txn</span>
                    <span className="font-mono font-semibold">{requisition.paymentReference}</span>
                  </div>
                )}
                {requisition.approvedAt && (
                  <div>
                    <span className="text-[10px] text-emerald-700 block">Approved At</span>
                    <span>{new Date(requisition.approvedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Note */}
          {isRejected && (
            <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3.5 text-xs text-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-700">
                <AlertCircle className="w-4 h-4" />
                <span>Rejection Reason</span>
              </div>
              <p className="italic">{requisition.rejectionReason || 'No reason provided.'}</p>
            </div>
          )}

          {/* Notes */}
          {requisition.notes && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Notes
              </span>
              <p className="whitespace-pre-line">{requisition.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-[11px] text-slate-400">
            {requisition.createdByName ? `Requested by ${requisition.createdByName}` : ''}
          </div>
          <div className="flex items-center gap-2">
            {isPending && onRejectClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRejectClick();
                }}
                className="px-3.5 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition"
              >
                Reject
              </button>
            )}
            {isPending && onApproveClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApproveClick();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs shadow-blue-500/20"
              >
                Approve & Disburse
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
