'use client';

import React from 'react';
import { Receipt, CheckCircle, Clock, AlertCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FinanceBill, FinanceBillStatus, useGetBillQuery } from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bill: FinanceBill | null;
  onPayBill?: (bill: FinanceBill) => void;
}

const STATUS_BADGE: Record<FinanceBillStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  DRAFT: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', icon: <Clock className="w-3.5 h-3.5" /> },
  UNPAID: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  PARTIALLY_PAID: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-800', icon: <Clock className="w-3.5 h-3.5" /> },
  PAID: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  OVERDUE: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> },
  VOID: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-500', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

function formatMoney(amount: number | string | null | undefined): string {
  const val = Number(amount || 0);
  return '৳' + val.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BillDetailModal({ isOpen, onClose, bill, onPayBill }: Props) {
  const { data: freshBill } = useGetBillQuery(bill?.id || '', {
    skip: !isOpen || !bill?.id,
  });

  if (!isOpen || !bill) return null;

  const activeBill = freshBill || bill;
  const statusMeta = STATUS_BADGE[activeBill.status] || STATUS_BADGE.UNPAID;
  const bal = Number(activeBill.balanceDue || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Supplier Bill #${activeBill.billNumber}`}
      subtitle={`Supplier: ${activeBill.supplierName} • Due on ${activeBill.dueDate}`}
      icon={<Receipt className="w-5 h-5" />}
      size="xl"
    >
      <div className="p-6 space-y-6">
        {/* Top bar with Status */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${statusMeta.bg} ${statusMeta.text}`}
            >
              {statusMeta.icon}
              {activeBill.status.replace('_', ' ')}
            </span>
          </div>

          <div>
            {bal > 0 && activeBill.status !== 'VOID' && onPayBill && (
              <button
                type="button"
                onClick={() => onPayBill(activeBill)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Record Payment
              </button>
            )}
          </div>
        </div>

        {/* Supplier Meta */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Vendor / Supplier:</p>
            <p className="text-base font-black text-slate-900 mt-0.5">{activeBill.supplierName}</p>
            {activeBill.supplierContact && <p className="text-xs text-slate-600 mt-0.5">Contact: {activeBill.supplierContact}</p>}
            {activeBill.supplierEmail && <p className="text-xs text-slate-600">Email: {activeBill.supplierEmail}</p>}
          </div>

          <div className="text-right space-y-1 text-xs">
            <p className="text-slate-500">
              <span className="font-bold text-slate-700">Category:</span> {activeBill.category}
            </p>
            <p className="text-slate-500">
              <span className="font-bold text-slate-700">Bill Date:</span> {activeBill.issueDate}
            </p>
            <p className="text-slate-500">
              <span className="font-bold text-slate-700">Due Date:</span> {activeBill.dueDate}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Item / Description</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Tax</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeBill.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900 text-xs">{item.title}</p>
                    {item.description && <p className="text-slate-500 text-[11px]">{item.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-slate-700">
                    {formatMoney(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-slate-500">
                    {Number(item.taxRate) > 0 ? `${item.taxRate}%` : '0%'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono font-bold text-slate-900">
                    {formatMoney(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end">
          <div className="w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">{formatMoney(activeBill.subtotal)}</span>
            </div>
            {Number(activeBill.taxAmount) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax Amount:</span>
                <span className="font-mono font-semibold">{formatMoney(activeBill.taxAmount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
              <span>Total Bill:</span>
              <span className="font-mono text-base">{formatMoney(activeBill.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 text-xs font-bold">
              <span>Paid Amount:</span>
              <span className="font-mono">{formatMoney(activeBill.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-rose-700 text-xs font-black pt-1.5 border-t border-slate-200">
              <span>Balance Due:</span>
              <span className="font-mono">{formatMoney(activeBill.balanceDue || 0)}</span>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              Payment History & Linked Transactions
            </h3>
            <span className="text-[11px] font-bold text-slate-500">
              {activeBill.payments?.length || 0} payments recorded
            </span>
          </div>

          {(!activeBill.payments || activeBill.payments.length === 0) ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No payments recorded yet for this bill. Remaining due: {formatMoney(activeBill.balanceDue)}.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Transaction #</th>
                    <th className="px-3 py-2.5">Account / Method</th>
                    <th className="px-3 py-2.5">Reference / Notes</th>
                    <th className="px-3 py-2.5 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {activeBill.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-mono font-bold text-slate-800">
                        {p.transactionDate}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-slate-600">
                        {p.transactionNumber}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-bold text-slate-800">{p.account?.name || 'Cash/Bank'}</span>
                        {p.paymentMethod && (
                          <span className="text-[10px] text-slate-500 ml-1.5 font-semibold">
                            ({p.paymentMethod})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500 truncate max-w-xs">
                        {p.reference || p.description || '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-black text-rose-600">
                        -{formatMoney(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {activeBill.notes && (
          <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="font-bold text-slate-700 uppercase mb-1">Notes / Terms</p>
            <p className="text-slate-600">{activeBill.notes}</p>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
