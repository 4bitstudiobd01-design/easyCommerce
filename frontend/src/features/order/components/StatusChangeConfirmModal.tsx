'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { OrderStatusType, Order } from '../api/orderApi';
import { isTerminalTarget, isBackwardTransition, requiresReason } from '../utils/statusTransition';

const CANCEL_REASONS = [
  'Customer requested cancellation',
  'Product unavailable',
  'Duplicate order',
  'Fraudulent/Spam',
  'Other',
];

const BACKWARD_REASONS = [
  'Marked wrong status by mistake',
  'Courier/fulfilment issue — reverting stage',
  'Customer requested a change',
  'Other',
];

interface StatusChangeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Pick<Order, 'orderNumber' | 'customerName' | 'grandTotal'> & { items?: { length: number }[] | any[] };
  targetStatus: OrderStatusType | null;
  currentStatus: OrderStatusType;
  isSubmitting: boolean;
  onConfirm: (targetStatus: OrderStatusType, reason?: string) => void;
}

/**
 * One shared confirm modal covering all three friction tiers for a status change:
 * lightweight (forward moves), reason-required for cancellation/return, and
 * reason-required for a backward move through the fulfilment sequence.
 */
export function StatusChangeConfirmModal({
  isOpen,
  onClose,
  order,
  targetStatus,
  currentStatus,
  isSubmitting,
  onConfirm,
}: StatusChangeConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  if (!targetStatus) return null;

  const terminal = isTerminalTarget(targetStatus);
  const backward = isBackwardTransition(currentStatus, targetStatus);
  const uncancelling = currentStatus === 'CANCELLED';
  const reasonRequired = requiresReason(currentStatus, targetStatus);

  const reasonOptions = targetStatus === 'CANCELLED' ? CANCEL_REASONS : BACKWARD_REASONS;

  const handleClose = () => {
    setReason('');
    setNote('');
    onClose();
  };

  const handleConfirm = () => {
    if (reasonRequired) {
      const finalReason = (reason || reasonOptions[0]) + (note ? ` - ${note}` : '');
      onConfirm(targetStatus, finalReason);
    } else {
      onConfirm(targetStatus);
    }
  };

  const title = reasonRequired
    ? terminal
      ? `${targetStatus === 'CANCELLED' ? 'Cancel' : 'Return'} Order`
      : uncancelling
      ? 'Restore Cancelled Order'
      : 'Move Order Backward'
    : 'Confirm Status Change';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={`Order #${order.orderNumber}`}
      icon={reasonRequired ? <AlertTriangle className="w-5 h-5 text-red-600" /> : undefined}
      footer={
        <>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleClose}
            className="px-4 py-2.5 bg-white text-slate-700 text-sm font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {reasonRequired ? 'Keep Order' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={isSubmitting || (reasonRequired && !reason)}
            onClick={handleConfirm}
            className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm ${
              terminal ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'
            } disabled:opacity-50`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Updating...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </>
      }
    >
      <div className="p-6">
        <p className="text-sm text-slate-600 mb-4">
          {reasonRequired ? (
            <>
              Are you sure you want to move Order{' '}
              <span className="font-bold text-slate-900">#{order.orderNumber}</span> from{' '}
              <span className="font-bold text-slate-900">{currentStatus.replace(/_/g, ' ')}</span> to{' '}
              <span className="font-bold text-slate-900">{targetStatus.replace(/_/g, ' ')}</span>?
            </>
          ) : (
            <>
              Confirm moving Order <span className="font-bold text-slate-900">#{order.orderNumber}</span> to{' '}
              <span className="font-bold text-slate-900">{targetStatus.replace(/_/g, ' ')}</span>.
            </>
          )}
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer:</span>
            <span className="font-bold text-slate-900">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Items:</span>
            <span className="font-bold text-slate-900">{order.items?.length || 0} items</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total:</span>
            <span className="font-bold text-slate-900">৳{Number(order.grandTotal).toLocaleString()}</span>
          </div>
        </div>

        {reasonRequired && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Reason {terminal ? `for ${targetStatus === 'CANCELLED' ? 'cancellation' : 'return'}` : uncancelling ? 'for restoring' : 'for reverting'}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="">Select a reason...</option>
                {reasonOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Additional Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Provide more context..."
                className="w-full p-3 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white min-h-[70px]"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
