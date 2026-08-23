'use client';

import React, { useState } from 'react';
import { DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { useRecordManualPaymentMutation, useGetOrderBalanceQuery, ManualPaymentMethod } from '@/features/payment/api/paymentApi';

interface RecordManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
}

const METHOD_OPTIONS: { value: ManualPaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BKASH', label: 'bKash' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'ROCKET', label: 'Rocket' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'OTHER', label: 'Other' },
];

export function RecordManualPaymentModal({ isOpen, onClose, orderId, orderNumber }: RecordManualPaymentModalProps) {
  const { data: balance } = useGetOrderBalanceQuery(orderId, { skip: !isOpen });
  const [recordManualPayment, { isLoading }] = useRecordManualPaymentMutation();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<ManualPaymentMethod>('CASH');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = () => {
    setAmount('');
    setMethod('CASH');
    setNote('');
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg('Enter an amount greater than 0.');
      return;
    }
    if (balance && parsedAmount > balance.balanceDue) {
      setErrorMsg(`Amount cannot exceed the balance due of ৳${balance.balanceDue.toLocaleString()}.`);
      return;
    }

    try {
      await recordManualPayment({ orderId, amount: parsedAmount, method, note: note || undefined }).unwrap();
      toast.success('Payment recorded.');
      handleClose();
    } catch (err: any) {
      const message = err?.data?.message || 'Failed to record payment.';
      setErrorMsg(Array.isArray(message) ? message[0] : message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Manual Payment"
      subtitle={`Order #${orderNumber}`}
      icon={<DollarSign className="w-5 h-5" />}
      footer={
        <>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleClose}
            className="px-4 py-2.5 bg-white text-slate-700 text-sm font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="record-manual-payment-form"
            disabled={isLoading}
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording...</> : 'Record Payment'}
          </button>
        </>
      }
    >
      <form id="record-manual-payment-form" onSubmit={handleSubmit} className="p-6 space-y-5">
        {balance && (
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Balance Due</span>
            <span className="text-xl font-black text-slate-900">৳{balance.balanceDue.toLocaleString()}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Amount Received</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 h-11 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Method</label>
          <div className="grid grid-cols-3 gap-2">
            {METHOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMethod(opt.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  method === opt.value
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Received in person at pickup"
            className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none min-h-[70px]"
          />
        </div>
      </form>
    </Modal>
  );
}
