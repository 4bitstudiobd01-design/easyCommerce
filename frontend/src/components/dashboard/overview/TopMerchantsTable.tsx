'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TopMerchant } from '../types/dashboard.types';

interface TopMerchantsTableProps {
  merchants: TopMerchant[];
}

export function TopMerchantsTable({ merchants }: TopMerchantsTableProps) {
  const getPlanBadge = (plan: TopMerchant['plan']) => {
    switch (plan) {
      case 'Business':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            Business
          </span>
        );
      case 'Growth':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            Growth
          </span>
        );
      case 'Starter':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            Starter
          </span>
        );
      case 'Enterprise':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
            Enterprise
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-700">
            {plan}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-4 lg:p-4.5 shadow-sm flex flex-col justify-between overflow-hidden min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-[14px] sm:text-[15px] font-bold text-gray-900">Top Merchants by Revenue</h2>

        <Link
          href="/admin/merchants"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-none flex-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100 font-semibold text-[10.5px]">
              <th className="pb-2 font-medium w-5">#</th>
              <th className="pb-2 font-medium">Merchant</th>
              <th className="pb-2 font-medium">Plan</th>
              <th className="pb-2 font-medium">Revenue (30d)</th>
              <th className="pb-2 font-medium text-right">Growth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {merchants.map((m) => (
              <tr key={m.rank} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2 text-slate-400 font-semibold text-[11px]">{m.rank}</td>
                <td className="py-2 font-semibold text-slate-900 text-[11.5px] truncate max-w-[120px]">
                  {m.name}
                </td>
                <td className="py-2">{getPlanBadge(m.plan)}</td>
                <td className="py-2 font-bold text-slate-900 tabular-nums text-[11.5px]">{m.revenue}</td>
                <td className="py-2 text-right">
                  <span
                    className={`inline-flex items-center font-semibold text-[10.5px] ${
                      m.isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {m.isPositive ? (
                      <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />
                    )}
                    {m.growth}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
