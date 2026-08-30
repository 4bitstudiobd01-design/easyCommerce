'use client';

import React from 'react';
import { FileText, Printer, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FinanceInvoice, FinanceInvoiceStatus } from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoice: FinanceInvoice | null;
  onRecordPayment?: (invoice: FinanceInvoice) => void;
}

const STATUS_BADGE: Record<FinanceInvoiceStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', icon: <Clock className="w-3.5 h-3.5" /> },
  UNPAID: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  PARTIALLY_PAID: { bg: 'bg-sky-100', text: 'text-sky-800', icon: <Clock className="w-3.5 h-3.5" /> },
  PAID: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  OVERDUE: { bg: 'bg-rose-100', text: 'text-rose-800', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  VOID: { bg: 'bg-slate-200', text: 'text-slate-500', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export function InvoiceDetailModal({ isOpen, onClose, invoice, onRecordPayment }: Props) {
  if (!isOpen || !invoice) return null;

  const statusMeta = STATUS_BADGE[invoice.status] || STATUS_BADGE.UNPAID;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice #${invoice.invoiceNumber}`}
      subtitle={`Issued on ${invoice.issueDate} • Due on ${invoice.dueDate}`}
      icon={<FileText className="w-5 h-5" />}
      size="xl"
    >
      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto print:max-h-none">
        {/* Top bar with Status and Print */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${statusMeta.bg} ${statusMeta.text}`}
            >
              {statusMeta.icon}
              {invoice.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
            {invoice.status !== 'PAID' && invoice.status !== 'VOID' && onRecordPayment && (
              <button
                type="button"
                onClick={() => onRecordPayment(invoice)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Record Payment
              </button>
            )}
          </div>
        </div>

        {/* Customer & Invoice Meta */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Billed To:</p>
            <p className="text-base font-bold text-slate-900 mt-1">{invoice.customerName}</p>
            {invoice.customerEmail && <p className="text-xs text-slate-600">{invoice.customerEmail}</p>}
            {invoice.customerPhone && <p className="text-xs text-slate-600">{invoice.customerPhone}</p>}
            {invoice.customerAddress && <p className="text-xs text-slate-500 mt-1">{invoice.customerAddress}</p>}
          </div>

          <div className="text-right space-y-1">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Invoice Number:</span> #{invoice.invoiceNumber}
            </p>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Issue Date:</span> {invoice.issueDate}
            </p>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Due Date:</span> {invoice.dueDate}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Item Description</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Tax</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item) => (
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
              <span className="font-mono">৳{Number(invoice.subtotal).toLocaleString()}</span>
            </div>
            {Number(invoice.taxAmount) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax Amount:</span>
                <span className="font-mono">৳{Number(invoice.taxAmount).toLocaleString()}</span>
              </div>
            )}
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount:</span>
                <span className="font-mono">-৳{Number(invoice.discountAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>Total:</span>
              <span className="font-mono text-base">৳{Number(invoice.totalAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600 text-xs font-semibold">
              <span>Paid Amount:</span>
              <span className="font-mono">৳{Number(invoice.paidAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-rose-600 text-xs font-bold pt-1 border-t border-slate-200">
              <span>Balance Due:</span>
              <span className="font-mono">৳{Number(invoice.balanceDue || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {invoice.notes && (
              <div>
                <p className="font-bold text-slate-700 uppercase mb-1">Notes</p>
                <p className="text-slate-600">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <p className="font-bold text-slate-700 uppercase mb-1">Terms & Conditions</p>
                <p className="text-slate-600">{invoice.terms}</p>
              </div>
            )}
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
