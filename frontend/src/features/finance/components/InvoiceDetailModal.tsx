'use client';

import React from 'react';
import {
  FileText,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  Globe,
  Store as StoreIcon,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FinanceInvoice, FinanceInvoiceStatus } from '../api/financeApi';
import { useGetMyStoresQuery } from '@/features/tenant/api/tenantApi';

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

function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value || 0);
  return amount.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function InvoiceDetailModal({ isOpen, onClose, invoice, onRecordPayment }: Props) {
  const { data: stores = [] } = useGetMyStoresQuery();

  if (!isOpen || !invoice) return null;

  const savedStoreId = typeof window !== 'undefined' ? localStorage.getItem('bitcommerce_active_store_id') : null;
  const activeStore = stores.find((s) => s.id === savedStoreId) || stores[0];

  const storeName = activeStore?.name || 'BitCommerce Store';
  const storeLogo = activeStore?.logo;
  const storeAddress = activeStore?.address;
  const storePhone = activeStore?.phone;
  const storeDomain = activeStore?.domain || activeStore?.slug;

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
      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto print:max-h-none font-sans text-slate-800">
        {/* Top bar with Status and Print */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
            {invoice.status !== 'PAID' && invoice.status !== 'VOID' && onRecordPayment && (
              <button
                type="button"
                onClick={() => onRecordPayment(invoice)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Record Payment
              </button>
            )}
          </div>
        </div>

        {/* Store Header & Invoice Document Title */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            {/* Store Logo or Brand Badge */}
            {storeLogo ? (
              <div className="w-14 h-14 rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 shrink-0 shadow-xs flex items-center justify-center">
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                {storeName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">{storeName}</h1>
              {storeAddress && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{storeAddress}</span>
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500 font-medium">
                {storePhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{storePhone}</span>
                  </span>
                )}
                {storeDomain && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{storeDomain}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <h2 className="font-black text-3xl text-slate-900 tracking-tight">INVOICE</h2>
            <p className="text-xs text-slate-500 mt-1">
              Invoice# <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
            </p>
          </div>
        </div>

        {/* Customer & Invoice Dates */}
        <div className="grid grid-cols-2 gap-6 text-sm py-2">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Billed To:</p>
            <p className="text-base font-bold text-slate-900 mt-1">{invoice.customerName}</p>
            {invoice.customerEmail && <p className="text-xs text-slate-600 mt-0.5">{invoice.customerEmail}</p>}
            {invoice.customerPhone && <p className="text-xs text-slate-600 mt-0.5">{invoice.customerPhone}</p>}
            {invoice.customerAddress && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{invoice.customerAddress}</p>}
          </div>

          <div className="text-right space-y-1.5">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Issue Date:</span>{' '}
              <span className="font-medium text-slate-900">{invoice.issueDate}</span>
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Due Date:</span>{' '}
              <span className="font-medium text-slate-900">{invoice.dueDate}</span>
            </div>
            {invoice.currency && (
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Currency:</span>{' '}
                <span className="font-bold text-slate-900">{invoice.currency}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
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
                    <p className="font-bold text-slate-900 text-xs">{item.title}</p>
                    {item.description && <p className="text-slate-500 text-[11px] mt-0.5">{item.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-slate-700">
                    ৳{formatMoney(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-slate-500">
                    {Number(item.taxRate) > 0 ? `${item.taxRate}%` : '0%'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono font-bold text-slate-900">
                    ৳{formatMoney(item.totalAmount)}
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
              <span className="font-mono font-semibold">৳{formatMoney(invoice.subtotal)}</span>
            </div>
            {Number(invoice.taxAmount) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax Amount:</span>
                <span className="font-mono font-semibold">৳{formatMoney(invoice.taxAmount)}</span>
              </div>
            )}
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount:</span>
                <span className="font-mono font-bold text-emerald-700">-৳{formatMoney(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
              <span>Total:</span>
              <span className="font-mono text-base">৳{formatMoney(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 text-xs font-bold">
              <span>Paid Amount:</span>
              <span className="font-mono">৳{formatMoney(invoice.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-rose-700 text-xs font-black pt-1.5 border-t border-slate-200">
              <span>Balance Due:</span>
              <span className="font-mono">৳{formatMoney(invoice.balanceDue || 0)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {invoice.notes && (
              <div>
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Notes</p>
                <p className="text-slate-600 leading-relaxed">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Terms & Conditions</p>
                <p className="text-slate-600 leading-relaxed">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Printable Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            {storeName} {storePhone ? `• ${storePhone}` : ''}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition print:hidden cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
