'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, ExternalLink, AlertCircle, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetPaymentDetailsQuery } from '../api/paymentApi';
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  formatCurrency,
  formatTransactionDate,
  formatTransactionTime,
} from '../utils/paymentFormatters';

interface PaymentDetailsDrawerProps {
  paymentId: string | null;
  onClose: () => void;
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-500 shrink-0">{label}</span>
    <span className="text-xs font-bold text-slate-900 text-right min-w-0 break-words">
      {children}
    </span>
  </div>
);

export const PaymentDetailsDrawer = ({ paymentId, onClose }: PaymentDetailsDrawerProps) => {
  const { data, isLoading, isError, error } = useGetPaymentDetailsQuery(paymentId as string, {
    skip: !paymentId,
  });

  // Escape closes the drawer, matching the platform's other overlays.
  useEffect(() => {
    if (!paymentId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [paymentId, onClose]);

  if (!paymentId) return null;

  const status = (error as { status?: number } | undefined)?.status;
  const errorMessage =
    status === 404
      ? 'This payment could not be found.'
      : status === 403
        ? 'You do not have permission to view this payment.'
        : 'Something went wrong loading this payment. Please try again.';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Payment details"
        className="relative w-full max-w-md bg-slate-50 h-full overflow-y-auto shadow-2xl"
      >
        <header className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-slate-900 truncate">
              {isLoading ? 'Loading payment…' : (data?.transactionNumber ?? 'Payment')}
            </h2>
            <p className="text-[11px] font-medium text-slate-400">Payment details & timeline</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </>
          ) : isError || !data ? (
            <div className="bg-white rounded-2xl border border-red-200 p-5 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" aria-hidden="true" />
              <p className="text-xs font-bold text-slate-900">{errorMessage}</p>
            </div>
          ) : (
            <>
              {/* Status & amount summary */}
              <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ring-1 ring-inset ${
                      PAYMENT_STATUS_STYLES[data.status]
                    }`}
                  >
                    {PAYMENT_STATUS_LABELS[data.status]}
                  </span>
                  {data.isRefundable && (
                    <Link
                      href={`/dashboard/orders/${data.orderId}?action=refund`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    >
                      <RotateCcw className="w-3 h-3" aria-hidden="true" />
                      Refund
                    </Link>
                  )}
                </div>

                <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {formatCurrency(data.amount, data.currency)}
                </p>
                {data.refundedAmount > 0 && (
                  <p className="text-[11px] font-semibold text-purple-600 mt-1">
                    {formatCurrency(data.refundedAmount, data.currency)} refunded ·{' '}
                    {formatCurrency(data.netAmount, data.currency)} net
                  </p>
                )}

                {data.failureReason && (
                  <p className="mt-3 text-[11px] font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    {data.failureReason}
                  </p>
                )}
              </section>

              {/* Payment facts */}
              <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 mb-2">Payment Information</h3>
                <Row label="Transaction ID">{data.transactionNumber}</Row>
                {data.gatewayTransactionId && (
                  <Row label="Gateway Ref.">{data.gatewayTransactionId}</Row>
                )}
                <Row label="Order">
                  <Link
                    href={`/dashboard/orders/${data.orderId}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    #{data.orderNumber}
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </Row>
                <Row label="Customer">
                  <span className="block">{data.customer.name}</span>
                  {data.customer.phone && (
                    <span className="block text-[11px] font-medium text-slate-400">
                      {data.customer.phone}
                    </span>
                  )}
                </Row>
                <Row label="Gateway">{data.gatewayLabel}</Row>
                <Row label="Method">{data.paymentMethodLabel}</Row>
                <Row label="Currency">{data.currency}</Row>
                <Row label="Created">
                  {formatTransactionDate(data.createdAt)} · {formatTransactionTime(data.createdAt)}
                </Row>
                {data.paidAt && (
                  <Row label="Paid at">
                    {formatTransactionDate(data.paidAt)} · {formatTransactionTime(data.paidAt)}
                  </Row>
                )}
              </section>

              {/* Refunds */}
              {data.refunds.length > 0 && (
                <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-900 mb-3">Refunds</h3>
                  <ul className="space-y-2.5">
                    {data.refunds.map((refund) => (
                      <li
                        key={refund.id}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="min-w-0">
                          <span className="block font-bold text-slate-900 truncate">
                            {refund.refundNumber}
                          </span>
                          <span className="block text-[10px] font-medium text-slate-400">
                            {formatTransactionDate(refund.createdAt)}
                          </span>
                        </span>
                        <span className="text-right shrink-0">
                          <span className="block font-bold text-slate-900">
                            {formatCurrency(refund.amount, data.currency)}
                          </span>
                          <span className="block text-[10px] font-semibold text-purple-600">
                            {refund.status}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Timeline — real recorded events only */}
              <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 mb-3">Payment Timeline</h3>
                {data.timeline.length === 0 ? (
                  <p className="text-[11px] font-medium text-slate-400 py-3 text-center">
                    No timeline events recorded for this payment.
                  </p>
                ) : (
                  <ol className="relative border-l border-slate-200 ml-1.5 space-y-4">
                    {data.timeline.map((event) => (
                      <li key={event.id} className="ml-4">
                        <span
                          className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"
                          aria-hidden="true"
                        />
                        <p className="text-xs font-bold text-slate-900">{event.label}</p>
                        {event.message && (
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                            {event.message}
                          </p>
                        )}
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                          {formatTransactionDate(event.createdAt)} ·{' '}
                          {formatTransactionTime(event.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};
