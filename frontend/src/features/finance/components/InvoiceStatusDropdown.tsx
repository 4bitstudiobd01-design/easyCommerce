'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Loader2,
  Check,
  CreditCard,
  FileEdit,
} from 'lucide-react';
import {
  FinanceInvoice,
  FinanceInvoiceStatus,
  useUpdateInvoiceStatusMutation,
} from '../api/financeApi';

interface InvoiceStatusDropdownProps {
  invoice: FinanceInvoice;
  onOpenStatusModal?: (invoice: FinanceInvoice) => void;
  onOpenPaymentModal?: (invoice: FinanceInvoice) => void;
}

interface StatusOption {
  value: FinanceInvoiceStatus;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  dotColor: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  DRAFT: {
    label: 'Draft',
    icon: <Clock className="w-3 h-3 text-slate-500" />,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  PENDING: {
    label: 'Pending',
    icon: <Clock className="w-3 h-3 text-amber-600" />,
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  UNPAID: {
    label: 'Unpaid',
    icon: <AlertCircle className="w-3 h-3 text-amber-600" />,
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    icon: <Clock className="w-3 h-3 text-sky-600" />,
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  PAID: {
    label: 'Paid',
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  OVERDUE: {
    label: 'Overdue',
    icon: <AlertTriangle className="w-3 h-3 text-rose-600" />,
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  VOID: {
    label: 'Void',
    icon: <XCircle className="w-3 h-3 text-slate-500" />,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

const DROPDOWN_OPTIONS: StatusOption[] = [
  {
    value: 'PAID',
    label: 'Paid',
    subtitle: 'Settled in full & deposit income',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    dotColor: 'bg-emerald-500',
    pillBg: 'bg-emerald-50',
    pillText: 'text-emerald-800',
    pillBorder: 'border-emerald-200',
  },
  {
    value: 'PENDING',
    label: 'Pending',
    subtitle: 'Awaiting customer payment',
    icon: <Clock className="w-4 h-4 text-amber-600 shrink-0" />,
    dotColor: 'bg-amber-500',
    pillBg: 'bg-amber-50',
    pillText: 'text-amber-800',
    pillBorder: 'border-amber-200',
  },
  {
    value: 'UNPAID',
    label: 'Unpaid',
    subtitle: 'Open invoice with outstanding balance',
    icon: <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />,
    dotColor: 'bg-amber-500',
    pillBg: 'bg-amber-50',
    pillText: 'text-amber-800',
    pillBorder: 'border-amber-200',
  },
  {
    value: 'OVERDUE',
    label: 'Overdue',
    subtitle: 'Past the scheduled payment due date',
    icon: <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />,
    dotColor: 'bg-rose-500',
    pillBg: 'bg-rose-50',
    pillText: 'text-rose-800',
    pillBorder: 'border-rose-200',
  },
  {
    value: 'VOID',
    label: 'Void',
    subtitle: 'Cancel invoice with zero monetary balance',
    icon: <XCircle className="w-4 h-4 text-slate-400 shrink-0" />,
    dotColor: 'bg-slate-400',
    pillBg: 'bg-slate-100',
    pillText: 'text-slate-600',
    pillBorder: 'border-slate-200',
  },
];

export function InvoiceStatusDropdown({
  invoice,
  onOpenStatusModal,
  onOpenPaymentModal,
}: InvoiceStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: false,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [updateInvoiceStatus, { isLoading }] = useUpdateInvoiceStatusMutation();

  const currentMeta = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.UNPAID;
  const balDue = Number(invoice.balanceDue || 0);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 264;
    const menuHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    const top = placeAbove ? rect.top - 6 : rect.bottom + 6;
    let left = rect.left + rect.width / 2 - menuWidth / 2;

    // Boundary constraints
    if (left < 12) left = 12;
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    setCoords({ top, left, placeAbove });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      calculatePosition();
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectStatus = async (targetStatus: FinanceInvoiceStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);

    if (targetStatus === invoice.status) {
      return;
    }

    // Marking as PAID requires account selection and payment details
    if (targetStatus === 'PAID') {
      if (onOpenStatusModal) {
        onOpenStatusModal(invoice);
      }
      return;
    }

    // Direct transition for other statuses
    try {
      await updateInvoiceStatus({
        id: invoice.id,
        status: targetStatus,
      }).unwrap();

      if (invoice.status === 'PAID') {
        toast.info(
          `Invoice #${invoice.invoiceNumber} reverted to ${targetStatus}. Income transaction reversed and balance adjusted.`,
        );
      } else {
        toast.success(`Invoice #${invoice.invoiceNumber} status updated to ${targetStatus}.`);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className={`group inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs transition-all duration-150 hover:brightness-95 hover:shadow-xs active:scale-95 cursor-pointer select-none ${
          currentMeta.bg
        } ${currentMeta.text} ${currentMeta.border}`}
        title="Click to change payment status"
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          currentMeta.icon
        )}
        <span>{currentMeta.label}</span>
        <ChevronDown
          className={`w-3 h-3 opacity-60 group-hover:opacity-100 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Menu Portal */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop click dismisser */}
            <div
              className="fixed inset-0 z-[99998] bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />

            {/* Dropdown Card */}
            <div
              role="menu"
              style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                transform: coords.placeAbove ? 'translateY(-100%)' : 'none',
              }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-[99999] w-[264px] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 select-none text-left"
            >
              {/* Header */}
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Update Status
                  </p>
                  <p className="text-xs font-black text-slate-800 font-mono">
                    #{invoice.invoiceNumber}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${currentMeta.bg} ${currentMeta.text} ${currentMeta.border}`}
                >
                  {currentMeta.label}
                </span>
              </div>

              {/* Status Options */}
              <div className="py-1 space-y-0.5">
                {DROPDOWN_OPTIONS.map((opt) => {
                  const isSelected = opt.value === invoice.status;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={(e) => handleSelectStatus(opt.value, e)}
                      className={`w-full px-2.5 py-2 rounded-xl text-left transition-colors flex items-center justify-between group/item cursor-pointer ${
                        isSelected
                          ? `${opt.pillBg} ${opt.pillText} font-black`
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5">{opt.icon}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold leading-tight">
                              {opt.label}
                            </span>
                            {opt.value === 'PAID' && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md">
                                Income
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 group-hover/item:text-slate-500 truncate leading-tight mt-0.5">
                            {opt.subtitle}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-slate-800 shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Additional Contextual Actions */}
              <div className="pt-1 mt-1 border-t border-slate-100 space-y-0.5">
                {balDue > 0 && invoice.status !== 'VOID' && onOpenPaymentModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onOpenPaymentModal(invoice);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-50 transition flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Record Partial Payment...</span>
                  </button>
                )}

                {onOpenStatusModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onOpenStatusModal(invoice);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-slate-400" />
                    <span>Detailed Status & Deposit...</span>
                  </button>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
