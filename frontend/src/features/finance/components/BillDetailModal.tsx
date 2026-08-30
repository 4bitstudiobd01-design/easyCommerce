'use client';

import React from 'react';
import { Receipt, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FinanceBill, FinanceBillStatus } from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bill: FinanceBill | null;
  onPayBill?: (bill: FinanceBill) => void;
}

const STATUS_BADGE: Record<FinanceBillStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', icon: <Clock className="w-3.5 h-3.5" /> },
  UNPAID: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  PARTIALLY_PAID: { bg: 'bg-sky-100', text: 'text-sky-800', icon: <Clock className="w-3.5 h-3.5" /> },
  PAID: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  OVERDUE: { bg: 'bg-rose-100', text: 'text-rose-800', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  VOID: { bg: 'bg-slate-200', text: 'text-slate-500', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export function BillDetailModal({ isOpen, onClose, bill, onPayBill }: Props) {
  if (!isOpen || !bill) return null;

  const statusMeta = STATUS_BADGE[bill.status] || STATUS_BADGE.UNPAID;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Supplier Bill #${bill.billNumber}`}
      subtitle={`Supplier: ${bill.supplierName} • Due on ${bill.dueDate}`}
      icon={<Receipt className="w-5 h-5" />}
      size="xl"
    >
      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        {/* Top bar with Status */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${statusMeta.bg} ${statusMeta.text}`}
            >
              {statusMeta.icon}
              {bill.status.replace('_', ' ')}
            </span>
          </div>

          <div>
            {bill.status !== 'PAID' && bill.status !== 'VOID' && onPayBill && (
              <button
                type="button"
                onClick={() => onPayBill(bill)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Pay Bill
              </button>
            )}
          </div>
        </div>

        {/* Supplier Meta */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Vendor / Supplier:</p>
            <p className="text-base font-bold text-slate-900 mt-1">{bill.supplierName}</p>
            {bill.supplierContact && <p className="text-xs text-slate-600">Contact: {bill.supplierContact}</p>}
            {bill.supplierEmail && <p className="text-xs text-slate-600">Email: {bill.supplierEmail}</p>}
          </div>

          <div className="text-right space-y-1">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Category:</span> {bill.category}
            </p>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Bill Date:</span> {bill.issueDate}
            </p>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Due Date:</span> {bill.dueDate}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Item / Description</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Tax</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bill.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 text-xs">{item.title}</p>
                    {item.description && <p className="text-slate-500 text-[11px]">{item.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-slate-700">
                    ৳{Number(item.unitPrice).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-slate-500">
                    {Number(item.taxRate) > 0 ? `${item.taxRate}%` : '0%'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono font-semibold text-slate-900">
                    ৳{Number(item.totalAmount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end">
          <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">৳{Number(bill.subtotal).toLocaleString()}</span>
            </div>
            {Number(bill.taxAmount) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax Amount:</span>
                <span className="font-mono">৳{Number(bill.taxAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>Total Bill:</span>
              <span className="font-mono text-base">৳{Number(bill.totalAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600 text-xs font-semibold">
              <span>Paid Amount:</span>
              <span className="font-mono">৳{Number(bill.paidAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-rose-600 text-xs font-bold pt-1 border-t border-slate-200">
              <span>Balance Due:</span>
              <span className="font-mono">৳{Number(bill.balanceDue || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {bill.notes && (
          <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-700 uppercase mb-1">Notes / Terms</p>
            <p className="text-slate-600">{bill.notes}</p>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
