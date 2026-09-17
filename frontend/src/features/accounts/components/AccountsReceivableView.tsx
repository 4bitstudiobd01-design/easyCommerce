'use client';

import React, { useState } from 'react';
import { TrendingUp, AlertCircle, Clock, CheckCircle2, Calendar, Filter } from 'lucide-react';
import { useGetReceivablesReportQuery } from '@/features/finance/api/financeApi';

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AccountsReceivableView() {
  const [period, setPeriod] = useState('this_month');

  const { data, isLoading } = useGetReceivablesReportQuery({ period } as any);

  const report = (data as any)?.data ?? data ?? {};
  const summary = report?.summary ?? {};
  const entries = report?.entries ?? [];

  const agingBuckets = [
    { label: 'Current', key: 'current', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { label: '1–30 Days', key: 'days1_30', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { label: '31–60 Days', key: 'days31_60', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { label: '61–90 Days', key: 'days61_90', color: 'text-orange-600 bg-orange-50 border-orange-100' },
    { label: '90+ Days', key: 'over90', color: 'text-rose-600 bg-rose-50 border-rose-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Accounts Receivable</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track money customers owe the business</p>
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

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs md:col-span-1">
          <p className="text-xs font-semibold text-slate-500 mb-2">Total Receivable</p>
          <p className="text-2xl font-extrabold text-slate-900">{formatMoney(summary?.totalReceivable ?? 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{entries.length} customers</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-2">Overdue</p>
          <p className="text-2xl font-extrabold text-rose-600">{formatMoney(summary?.overdue ?? 0)}</p>
          <p className="text-[11px] text-rose-400 mt-1 font-medium">Requires follow-up</p>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-2">Due This Month</p>
          <p className="text-2xl font-extrabold text-emerald-600">{formatMoney(summary?.dueThisMonth ?? 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Expected receipts</p>
        </div>
      </div>

      {/* Aging Buckets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {agingBuckets.map(({ label, key, color }) => (
          <div key={key} className={`bg-white border rounded-xl p-4 shadow-xs ${color.split(' ')[2] ?? 'border-slate-100'}`}>
            <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
            <p className={`text-lg font-extrabold ${color.split(' ')[0]}`}>
              {formatMoney(summary?.[key] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      {/* AR Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Customer Aging Details</h3>
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </div>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No outstanding receivables</p>
            <p className="text-xs text-slate-400 mt-1">All invoices are paid or no invoices exist for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Invoice</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Outstanding</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Days</th>
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
                      <td className="px-5 py-3 font-semibold text-slate-800">{entry.customerName ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{entry.invoiceNumber ?? entry.reference ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.dueDate ? new Date(entry.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatMoney(entry.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatMoney(entry.amountPaid)}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">{formatMoney(outstanding)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${statusColor}`}>
                          {daysOverdue > 0 ? `+${daysOverdue}d` : 'Current'}
                        </span>
                      </td>
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
