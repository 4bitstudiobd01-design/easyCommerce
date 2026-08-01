'use client';

import React, { useState } from 'react';
import { useCreateCouponMutation } from '../api/couponApi';
import { X, Tag, Plus, CheckCircle2, Percent, DollarSign } from 'lucide-react';

interface CreateCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCouponModal({ isOpen, onClose }: CreateCouponModalProps) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxUses, setMaxUses] = useState<number>(100);
  const [expiryDate, setExpiryDate] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [createCoupon, { isLoading }] = useCreateCouponMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await createCoupon({
        code,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount),
        maxUses: Number(maxUses),
        expiryDate: expiryDate || undefined,
      }).unwrap();

      setCode('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to create promo coupon.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-8 relative space-y-6">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Create New Promo Code</h3>
            <p className="text-xs text-slate-400">Set up discount codes for storefront checkout</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 font-bold text-xs rounded-2xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Promo Code Name (Uppercase)
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. EASY20 or SUMON100"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳ BDT)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Discount Value ({discountType === 'PERCENTAGE' ? '%' : '৳'})
              </label>
              <input
                type="number"
                required
                min={1}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Min. Order Amount (৳)
              </label>
              <input
                type="number"
                min={0}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Max Usage Limit
              </label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              {isLoading ? (
                <span>Creating Code...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Promo Code</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
