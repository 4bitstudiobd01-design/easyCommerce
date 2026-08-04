'use client';

import React, { useState } from 'react';
import { useCreateCouponMutation } from '@/features/coupon/api/couponApi';
import { Tag, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CreateCouponPage() {
  const router = useRouter();

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxUses, setMaxUses] = useState<number>(100);
  const [expiryDate, setExpiryDate] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [createCoupon, { isLoading }] = useCreateCouponMutation();

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

      toast.success('Coupon created successfully!');
      router.push('/dashboard/coupons');
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to create promo coupon.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative space-y-6 p-8 md:p-12">
        
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Tag className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-slate-900">Create New Promo Code</h1>
            <p className="text-sm text-slate-500 mt-1">Set up discount codes for storefront checkout</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 font-bold text-sm rounded-2xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 font-semibold">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Promo Code Name (Uppercase)
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. EASY20 or SUMON100"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (৳ BDT)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Discount Value ({discountType === 'PERCENTAGE' ? '%' : '৳'})
              </label>
              <input
                type="number"
                required
                min={1}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Min. Order Amount (৳)
              </label>
              <input
                type="number"
                min={0}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Max Usage Limit
              </label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
          </div>

          <div className="pt-6 flex items-center justify-end gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-lg"
            >
              {isLoading ? (
                <span>Creating Code...</span>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
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
