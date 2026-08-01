'use client';

import React, { useState } from 'react';
import { useGetMerchantCouponsQuery } from '../api/couponApi';
import { CreateCouponModal } from './CreateCouponModal';
import { Tag, Plus, CheckCircle2, Clock, Percent, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

export function CouponManagementTable() {
  const { data: coupons = [], isLoading, isError, refetch } = useGetMerchantCouponsQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      <CreateCouponModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Promo Coupons & Discounts</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage promotional discount codes for your storefront checkout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Promo Code</th>
              <th className="px-6 py-3.5">Discount</th>
              <th className="px-6 py-3.5">Min. Order Amount</th>
              <th className="px-6 py-3.5">Usage Count</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Expiration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {isLoading ? (
              <TableRowSkeleton columns={6} />
            ) : isError || coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  No promo coupons created yet. Click "Create Promo Code" to add discount codes!
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-extrabold text-blue-600 text-sm bg-blue-50 px-3 py-1 rounded-xl border border-blue-200 inline-block">
                      {coupon.code}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {coupon.discountType === 'PERCENTAGE'
                        ? `${coupon.discountValue}% OFF`
                        : `৳${Number(coupon.discountValue).toLocaleString()} OFF`}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-700">
                      ৳{Number(coupon.minOrderAmount).toLocaleString()}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-900">
                      {coupon.usedCount} / {coupon.maxUses} uses
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {coupon.isActive ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ACTIVE</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-red-50 text-red-700 font-bold text-[10px] rounded-full border border-red-200 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>DISABLED</span>
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right text-slate-400 font-medium text-[11px]">
                    {coupon.expiryDate
                      ? new Date(coupon.expiryDate).toLocaleDateString()
                      : 'No Expiry'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
