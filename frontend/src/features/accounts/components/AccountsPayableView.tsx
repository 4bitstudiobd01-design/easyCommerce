'use client';

import React, { useState } from 'react';
import { TrendingDown, CheckCircle2 } from 'lucide-react';
import { useGetPayablesReportQuery } from '@/features/finance/api/financeApi';

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AccountsPayableView() {
  const [period, setPeriod] = useState('this_month');

  const { data, isLoading } = useGetPayablesReportQuery({ period } as any);

  const report = (data as any)?.data ?? data ?? {};
  const summary = report?.summary ?? {};
  const entries = report?.entries ?? [];

  const agingBuckets = [
    { label: 'Current', key: 'current', color: 'text-emerald-600 border-emerald-100' },
    { label: '1–30 Days', key: 'days1_30', color: 'text-blue-600 border-blue-100' },
    { label: '31–60 Days', key: 'days31_60', color: 'text-amber-600 border-amber-100' },
    { label: '61–90 Days', key: 'days61_90', color: 'text-orange-600 border-orange-100' },
    { label: '90+ Days', key: 'over90', color: 'text-rose-600 border-rose-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Accounts Payable</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track money the business owes vendors</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_quarter">This Quarter</option>
          <option value="this_year">This Year</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-2">Total Payable</p>
          <p className="text-2xl font-extrabold text-slate-900">{formatMoney(summary?.totalPayable ?? 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{entries.length} vendors</p>
        </div>
        <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-2">Due This Week</p>
          <p className="text-2xl font-extrabold text-amber-600">{formatMoney(summary?.dueThisWeek ?? 0)}</p>
          <p className="text-[11px] text-amber-400 mt-1 font-medium">Upcoming payments</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-2">Overdue</p>
          <p className="text-2xl font-extrabold text-rose-600">{formatMoney(summary?.overdue ?? 0)}</p>
          <p className="text-[11px] text-rose-400 mt-1 font-medium">Immediate action required</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {agingBuckets.map(({ label, key, color }) => (
          <div key={key} className={`bg-white border rounded-xl p-4 shadow-xs ${color.split(' ')[1]}`}>
            <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
            <p className={`text-lg font-extrabold ${color.split(' ')[0]}`}>{formatMoney(summary?.[key] ?? 0)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Vendor Aging Details</h3>
          <TrendingDown className="w-4 h-4 text-slate-400" />
        </div>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No outstanding payables</p>
            <p className="text-xs text-slate-400 mt-1">All bills are paid or no bills exist for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Bill</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Outstanding</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.map((entry: any, i: number) => {
                  const outstanding = Number(entry.totalAmount ?? 0) - Number(entry.amountPaid ?? 0);
                  const daysOverdue = entry.daysOverdue ?? 0;
                  const statusColor =
                    daysOverdue > 90 ? 'bg-rose-100 text-rose-700' :
                    daysOverdue > 60 ? 'bg-orange-100 text-orange-700' :
                    daysOverdue > 30 ? 'bg-amber-100 text-amber-700' :
                    daysOverdue > 0 ? 'bg-blue-100 text-blue-700' :
                    'bg-emerald-100 text-emerald-700';
                  return (
                    <tr key={entry.id ?? i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-800">{entry.vendorName ?? entry.supplierName ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{entry.billNumber ?? entry.reference ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.dueDate ? new Date(entry.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatMoney(entry.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatMoney(entry.amountPaid)}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600">{formatMoney(outstanding)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${statusColor}`}>
                          {entry.status ?? 'UNPAID'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
