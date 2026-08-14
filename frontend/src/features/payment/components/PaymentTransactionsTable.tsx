'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreVertical,
  Receipt,
  ShoppingBag,
  User,
  Clock,
  RotateCcw,
  Inbox,
  Smartphone,
  CreditCard,
  Truck,
  Landmark,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type {
  PaymentMethodType,
  PaymentTransaction,
} from '../api/paymentApi';
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  formatCurrency,
  formatTransactionDate,
  formatTransactionTime,
  getAvatarColor,
  getBrandStyle,
  getInitials,
} from '../utils/paymentFormatters';

interface PaymentTransactionsTableProps {
  transactions: PaymentTransaction[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onViewPayment: (id: string) => void;
}

const METHOD_ICONS: Record<PaymentMethodType, React.ElementType> = {
  BKASH: Smartphone,
  NAGAD: Smartphone,
  ROCKET: Smartphone,
  UPAY: Smartphone,
  CARD: CreditCard,
  BANK_TRANSFER: Landmark,
  COD: Truck,
};

const COLUMN_COUNT = 9;

/** Row action menu, closing on outside click and Escape for keyboard users. */
const RowActions = ({
  transaction,
  onViewPayment,
}: {
  transaction: PaymentTransaction;
  onViewPayment: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const actionClass =
    'w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 focus:outline-none focus-visible:bg-slate-50';

  return (
    <div ref={containerRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Actions for transaction ${transaction.transactionNumber}`}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-20"
        >
          <button
            type="button"
            role="menuitem"
            className={actionClass}
            onClick={() => {
              setIsOpen(false);
              onViewPayment(transaction.id);
            }}
          >
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            View Payment
          </button>

          <button
            type="button"
            role="menuitem"
            className={actionClass}
            onClick={() => {
              setIsOpen(false);
              router.push(`/dashboard/orders/${transaction.orderId}`);
            }}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
            View Order
          </button>

          {transaction.customer.id && (
            <button
              type="button"
              role="menuitem"
              className={actionClass}
              onClick={() => {
                setIsOpen(false);
                router.push(`/dashboard/customers?customerId=${transaction.customer.id}`);
              }}
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
              View Customer
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            className={actionClass}
            onClick={() => {
              setIsOpen(false);
              onViewPayment(transaction.id);
            }}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            View Timeline
          </button>

          {/* Refund is offered only when the domain says the payment can still
              be refunded — never on failed, cancelled or fully refunded rows. */}
          {transaction.isRefundable && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <Link
                role="menuitem"
                href={`/dashboard/orders/${transaction.orderId}?action=refund`}
                className={actionClass}
                onClick={() => setIsOpen(false)}
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-500" />
                Refund
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const TableSkeletonRow = () => (
  <tr className="border-b border-slate-100">
    {Array.from({ length: COLUMN_COUNT }).map((_, idx) => (
      <td key={idx} className="px-4 py-3.5">
        <Skeleton className="h-4 w-full max-w-[110px] rounded" />
      </td>
    ))}
  </tr>
);

export const PaymentTransactionsTable = ({
  transactions,
  isLoading,
  hasActiveFilters,
  onClearFilters,
  onViewPayment,
}: PaymentTransactionsTableProps) => {
  const headerClass =
    'px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap';

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse">
        <caption className="sr-only">
          Payment transactions with order, customer, gateway, method, amount, status and date
        </caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60">
            <th scope="col" className={headerClass}>Transaction</th>
            <th scope="col" className={headerClass}>Order</th>
            <th scope="col" className={headerClass}>Customer</th>
            <th scope="col" className={headerClass}>Gateway</th>
            <th scope="col" className={headerClass}>Method</th>
            <th scope="col" className={`${headerClass} text-right`}>Amount</th>
            <th scope="col" className={headerClass}>Status</th>
            <th scope="col" className={headerClass}>Date</th>
            <th scope="col" className={`${headerClass} text-right`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, idx) => <TableSkeletonRow key={idx} />)
          ) : transactions.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className="px-4 py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <Inbox className="w-6 h-6 text-slate-400" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">No payments found</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {hasActiveFilters
                      ? 'No transactions match the current filters. Try adjusting or clearing them.'
                      : 'Payment transactions will appear here once your store starts receiving orders.'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={onClearFilters}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => {
              const MethodIcon = METHOD_ICONS[transaction.paymentMethod] ?? CreditCard;

              return (
                <tr
                  key={transaction.id}
                  className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                >
                  {/* TRANSACTION */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onViewPayment(transaction.id)}
                      className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
                    >
                      <span
                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-[9px] font-extrabold"
                        aria-hidden="true"
                      >
                        TX
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                          {transaction.transactionNumber}
                        </span>
                        {transaction.gatewayTransactionId && (
                          <span className="block text-[10px] font-medium text-slate-400 truncate max-w-[120px]">
                            {transaction.gatewayTransactionId}
                          </span>
                        )}
                      </span>
                    </button>
                  </td>

                  {/* ORDER */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/orders/${transaction.orderId}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      #{transaction.orderNumber}
                    </Link>
                  </td>

                  {/* CUSTOMER */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${getAvatarColor(
                          transaction.customer.name,
                        )}`}
                        aria-hidden="true"
                      >
                        {getInitials(transaction.customer.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 truncate max-w-[140px]">
                          {transaction.customer.name}
                        </span>
                        {transaction.customer.phone && (
                          <span className="block text-[10px] font-medium text-slate-400 truncate">
                            {transaction.customer.phone}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* GATEWAY */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-700">
                      {transaction.gatewayLabel}
                    </span>
                  </td>

                  {/* METHOD */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${getBrandStyle(
                          transaction.paymentMethod,
                        )}`}
                        aria-hidden="true"
                      >
                        <MethodIcon className="w-3.5 h-3.5" strokeWidth={2.25} />
                      </span>
                      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                        {transaction.paymentMethodLabel}
                      </span>
                    </span>
                  </td>

                  {/* AMOUNT */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-extrabold text-slate-900 whitespace-nowrap">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                    {transaction.refundedAmount > 0 && (
                      <span className="block text-[10px] font-medium text-purple-600 whitespace-nowrap">
                        -{formatCurrency(transaction.refundedAmount, transaction.currency)} refunded
                      </span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ring-1 ring-inset whitespace-nowrap ${
                        PAYMENT_STATUS_STYLES[transaction.status]
                      }`}
                    >
                      {PAYMENT_STATUS_LABELS[transaction.status]}
                    </span>
                  </td>

                  {/* DATE */}
                  <td className="px-4 py-3">
                    <span className="block text-xs font-medium text-slate-700 whitespace-nowrap">
                      {formatTransactionDate(transaction.createdAt)}
                    </span>
                    <span className="block text-[10px] font-medium text-slate-400 whitespace-nowrap">
                      {formatTransactionTime(transaction.createdAt)}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-3">
                    <RowActions transaction={transaction} onViewPayment={onViewPayment} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
