'use client';

import React, { useState } from 'react';
import { Link2, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { useCreatePaymentLinkMutation, useGetOrderBalanceQuery, PaymentLinkResult } from '@/features/payment/api/paymentApi';

interface SendPaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
}

export function SendPaymentLinkModal({ isOpen, onClose, orderId, orderNumber }: SendPaymentLinkModalProps) {
  const { data: balance } = useGetOrderBalanceQuery(orderId, { skip: !isOpen });
  const [createPaymentLink, { isLoading }] = useCreatePaymentLinkMutation();

  const [amount, setAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<PaymentLinkResult | null>(null);

  const handleClose = () => {
    setAmount('');
    setErrorMsg('');
    setResult(null);
    onClose();
  };

  const handleGenerate = async () => {
    setErrorMsg('');
    const parsedAmount = amount ? Number(amount) : undefined;

    if (parsedAmount !== undefined && (!parsedAmount || parsedAmount <= 0)) {
      setErrorMsg('Enter a valid amount, or leave blank to charge the full balance due.');
      return;
    }
    if (balance && parsedAmount && parsedAmount > balance.balanceDue) {
      setErrorMsg(`Amount cannot exceed the balance due of ৳${balance.balanceDue.toLocaleString()}.`);
      return;
    }

    try {
      const link = await createPaymentLink({ orderId, amount: parsedAmount }).unwrap();
      setResult(link);
    } catch (err: any) {
      const message = err?.data?.message || 'Failed to generate payment link.';
      setErrorMsg(Array.isArray(message) ? message[0] : message);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.gatewayUrl);
    toast.success('Link copied to clipboard.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Send Payment Link"
      subtitle={`Order #${orderNumber}`}
      icon={<Link2 className="w-5 h-5" />}
      size="lg"
      footer={
        result ? (
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        ) : (
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
              type="button"
              disabled={isLoading}
              onClick={() => handleGenerate()}
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                'Generate Link'
              )}
            </button>
          </>
        )
      }
    >
      <div className="p-6 space-y-5">
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

        {result ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-emerald-600">
              Link generated for ৳{result.amount.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-700 truncate flex-1">{result.gatewayUrl}</p>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                title="Copy link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Amount (leave blank for full balance)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={balance ? balance.balanceDue.toLocaleString() : '0.00'}
                className="w-full pl-8 pr-4 h-11 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
