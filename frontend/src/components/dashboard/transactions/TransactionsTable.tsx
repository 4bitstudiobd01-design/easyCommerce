'use client';

import React, { useState } from 'react';
import {
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Building2,
  FileText,
  RotateCcw,
  Mail,
  ExternalLink,
  Download,
  Copy,
} from 'lucide-react';
import { TransactionRecord } from './types';
import { toast } from 'sonner';

interface TransactionsTableProps {
  transactions: TransactionRecord[];
  onViewDetails: (txn: TransactionRecord) => void;
  onRefundTransaction?: (txn: TransactionRecord) => void;
}

export function TransactionsTable({
  transactions,
  onViewDetails,
  onRefundTransaction,
}: TransactionsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('10');

  const handleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map((t) => t.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  const renderGatewayLogo = (gateway: TransactionRecord['gateway']) => {
    switch (gateway) {
      case 'stripe':
        return (
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-[#635BFF] font-extrabold tracking-tighter text-[13px] lowercase">
              stripe
            </span>
            <span className="text-slate-700 text-xs font-semibold">Stripe</span>
          </div>
        );
      case 'sslcommerz':
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-[#00529B] font-extrabold tracking-tight text-[11px] uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              sslcommerz
            </span>
          </div>
        );
      case 'bkash':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#E2136E] text-white flex items-center justify-center font-bold text-[9px] shrink-0">
              ৳
            </div>
            <span className="text-[#E2136E] font-bold text-xs tracking-tight">
              bKash
            </span>
          </div>
        );
      case 'bank_transfer':
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
              <Building2 className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">
              Bank Transfer
            </span>
          </div>
        );
      default:
        return (
          <span className="text-xs font-semibold text-slate-700">
            {gateway}
          </span>
        );
    }
  };

  const renderStatus = (status: TransactionRecord['status']) => {
    switch (status) {
      case 'Success':
        return (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Success</span>
          </div>
        );
      case 'Refunded':
        return (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Refunded</span>
          </div>
        );
      case 'Failed':
        return (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>Failed</span>
          </div>
        );
      case 'Pending':
        return (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500">
            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>Pending</span>
          </div>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse min-w-[950px]">
          {/* Header */}
          <thead>
            <tr className="border-b border-slate-200/90 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {/* Checkbox & ID */}
              <th className="py-3.5 pl-4 pr-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === transactions.length &&
                      transactions.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Transaction ID</span>
                </div>
              </th>

              <th className="py-3.5 px-3">Merchant / Store</th>
              <th className="py-3.5 px-3">Type</th>
              <th className="py-3.5 px-3">Gateway</th>
              <th className="py-3.5 px-3">Amount</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 px-3">Date & Time</th>
              <th className="py-3.5 pr-4 pl-2 text-center w-20">Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100 text-xs">
            {transactions.map((t) => {
              const isChecked = selectedIds.includes(t.id);

              return (
                <tr
                  key={t.id}
                  onClick={() => onViewDetails(t)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    isChecked ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  {/* 1. Checkbox & ID */}
                  <td
                    className="py-3.5 pl-4 pr-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectOne(t.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="leading-snug">
                        <button
                          type="button"
                          onClick={() => onViewDetails(t)}
                          className="text-[13px] font-bold text-slate-900 hover:text-emerald-700 hover:underline block text-left cursor-pointer transition-colors"
                        >
                          {t.id}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {t.reference}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 2. Merchant / Store */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[13px] font-bold text-slate-900 block truncate">
                        {t.merchant.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block mt-0.5 truncate">
                        {t.merchant.domain}
                      </span>
                    </div>
                  </td>

                  {/* 3. Type */}
                  <td className="py-3.5 px-3">
                    <span className="text-xs font-semibold text-slate-700">
                      {t.type}
                    </span>
                  </td>

                  {/* 4. Gateway */}
                  <td className="py-3.5 px-3">
                    {renderGatewayLogo(t.gateway)}
                  </td>

                  {/* 5. Amount */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span
                        className={`text-[13px] font-bold block ${
                          t.isNegative ? 'text-rose-500' : 'text-slate-900'
                        }`}
                      >
                        {t.amount}
                      </span>
                      {t.secondaryAmount && (
                        <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                          {t.secondaryAmount}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 6. Status */}
                  <td className="py-3.5 px-3">
                    {renderStatus(t.status)}
                  </td>

                  {/* 7. Date & Time */}
                  <td className="py-3.5 px-3">
                    <div className="leading-snug">
                      <span className="text-[12px] font-semibold text-slate-700 block">
                        {t.createdAt.date}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                        {t.createdAt.time}
                      </span>
                    </div>
                  </td>

                  {/* 8. Actions */}
                  <td
                    className="py-3.5 pr-4 pl-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1 relative">
                      {/* Eye Button */}
                      <button
                        type="button"
                        onClick={() => onViewDetails(t)}
                        title="View Details"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* 3-dots Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === t.id ? null : t.id
                            )
                          }
                          title="More Options"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === t.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onViewDetails(t);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-semibold"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>View Transaction Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  toast.info(`Downloading PDF receipt for ${t.id}`);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                                <span>Download PDF Receipt</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleCopy(t.id, 'Transaction ID');
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy ID</span>
                              </button>

                              {t.status === 'Success' && !t.isNegative && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onRefundTransaction?.(t);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-amber-700 hover:bg-amber-50 transition-colors font-medium"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Issue Refund</span>
                                </button>
                              )}

                              <div className="border-t border-slate-100 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  toast.success(`Resent email receipt to ${t.merchant.email}`);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>Resend Email</span>
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

      {/* Pagination Footer */}
      <div className="p-3.5 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        {/* Left Count */}
        <div>
          Showing <span className="font-bold text-slate-800">1</span> to{' '}
          <span className="font-bold text-slate-800">10</span> of{' '}
          <span className="font-bold text-slate-800">8,456</span> transactions
        </div>

        {/* Center Page Numbers */}
        <div className="flex items-center gap-1 self-center">
          <button
            type="button"
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
            disabled
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="w-7 h-7 rounded-lg text-xs font-bold border border-emerald-500 text-emerald-600 bg-emerald-50/60 shadow-2xs flex items-center justify-center transition-colors"
          >
            1
          </button>

          {[2, 3, 4, 5].map((pg) => (
            <button
              key={pg}
              type="button"
              onClick={() => toast.info(`Page ${pg}`)}
              className="w-7 h-7 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              {pg}
            </button>
          ))}

          <span className="text-slate-400 px-1">...</span>

          <button
            type="button"
            onClick={() => toast.info(`Page 846`)}
            className="w-7 h-7 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            846
          </button>

          <button
            type="button"
            onClick={() => toast.info('Next page')}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Rows Per Page */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span>Rows per page</span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>
  );
}
