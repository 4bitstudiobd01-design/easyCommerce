import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, IndianRupee } from 'lucide-react';
import { Order, useCreateRefundMutation } from '../api/orderApi';
import { toast } from 'react-hot-toast';

interface RefundModalProps {
  order: Order;
  onClose: () => void;
}

export function RefundModal({ order, onClose }: RefundModalProps) {
  const [createRefund, { isLoading }] = useCreateRefundMutation();
  
  const [amount, setAmount] = useState<string>(order.grandTotal.toString());
  const [reason, setReason] = useState('Customer requested');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const refundAmount = parseFloat(amount);
    
    if (isNaN(refundAmount) || refundAmount <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    try {
      await createRefund({ orderId: order.id, amount: refundAmount, reason }).unwrap();
      toast.success('Refund requested successfully');
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to request refund');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Issue Refund</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {(order.paymentStatus === 'COD_PENDING' || order.paymentStatus === 'UNPAID') ? (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Cannot issue refund</span>
                This order has not been paid yet (Status: {order.paymentStatus}). You can only refund collected payments.
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Total</span>
                  <span className="font-bold text-slate-900">৳{Number(order.grandTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-bold text-slate-900">{order.paymentMethod}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Refund Amount (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={order.grandTotal}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-lg font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </>
          )}

        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 text-sm font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || order.paymentStatus === 'COD_PENDING' || order.paymentStatus === 'UNPAID'}
            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Request Refund'}
          </button>
        </div>
      </div>
    </div>
  );
}
