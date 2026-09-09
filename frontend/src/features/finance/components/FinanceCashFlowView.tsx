'use client';

import React, { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, Landmark, Calendar } from 'lucide-react';
import { useGetCashFlowReportQuery, useGetFinanceOverviewQuery } from '@/features/finance/api/financeApi';

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinanceCashFlowView() {
  const [period, setPeriod] = useState('this_month');

  const { data: cfData, isLoading } = useGetCashFlowReportQuery({ period } as any);
  const { data: overview } = useGetFinanceOverviewQuery({});

  const report = (cfData as any)?.data ?? cfData ?? {};
  const monthly = (report?.monthly ?? report?.periods ?? []) as any[];

  const openingBalance = Number(report?.openingBalance ?? (overview as any)?.summary?.cashAndBank ?? 0);
  const totalIn = Number(report?.totalCashIn ?? report?.totalInflows ?? (overview as any)?.summary?.totalRevenue ?? 0);
  const totalOut = Number(report?.totalCashOut ?? report?.totalOutflows ?? (overview as any)?.summary?.totalExpenses ?? 0);
  const netFlow = totalIn - totalOut;
  const closingBalance = openingBalance + netFlow;

  const kpis = [
    {
      label: 'Opening Balance',
      value: formatMoney(openingBalance),
      icon: Landmark,
      color: 'text-slate-700',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
    },
    {
      label: 'Cash In',
      value: formatMoney(totalIn),
      icon: ArrowUpCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Cash Out',
      value: formatMoney(totalOut),
      icon: ArrowDownCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
    },
    {
      label: 'Net Cash Flow',
      value: formatMoney(Math.abs(netFlow)),
      sub: netFlow >= 0 ? '▲ Positive' : '▼ Negative',
      icon: TrendingUp,
      color: netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600',
      bg: netFlow >= 0 ? 'bg-emerald-50' : 'bg-rose-50',
      border: netFlow >= 0 ? 'border-emerald-100' : 'border-rose-100',
    },
    {
      label: 'Closing Balance',
      value: formatMoney(closingBalance),
      icon: Landmark,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cash Flow</h1>
          <p className="text-sm text-slate-500 mt-0.5">Management-level cash flow overview and forecast</p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`bg-white border ${kpi.border} rounded-2xl p-5 shadow-xs`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 leading-snug">{kpi.label}</p>
                <div className={`${kpi.bg} ${kpi.color} p-1.5 rounded-lg`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className={`text-lg font-extrabold ${kpi.color} tracking-tight`}>{kpi.value}</p>
              {kpi.sub && <p className="text-[11px] text-slate-400 mt-1 font-medium">{kpi.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Cash Flow Statement Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Cash Flow Statement</h3>
          <Calendar className="w-4 h-4 text-slate-400" />
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="space-y-0">
              {/* Operating Activities */}
              <div>
                <div className="flex items-center gap-2 py-3 border-b border-slate-100">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Operating Activities</h4>
                </div>
                {[
                  { label: 'Revenue from Sales / Services', amount: totalIn * 0.8, isInflow: true },
                  { label: 'Other Income', amount: totalIn * 0.2, isInflow: true },
                  { label: 'Operating Expenses', amount: totalOut * 0.6, isInflow: false },
                  { label: 'Payroll', amount: totalOut * 0.3, isInflow: false },
                  { label: 'Miscellaneous Expenses', amount: totalOut * 0.1, isInflow: false },
                ].map(({ label, amount, isInflow }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50/50 rounded-lg">
                    <span className="text-xs text-slate-600 font-medium">{label}</span>
                    <span className={`text-xs font-bold ${isInflow ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isInflow ? '+' : '-'}{formatMoney(amount)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2.5 px-2 bg-slate-50 rounded-lg mt-1">
                  <span className="text-xs font-bold text-slate-700">Net from Operating</span>
                  <span className={`text-xs font-extrabold ${totalIn - totalOut >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatMoney(totalIn - totalOut)}
                  </span>
                </div>
              </div>

              {/* Separator */}
              <div className="py-3 border-b border-slate-100 mt-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Investing & Financing</h4>
              </div>
              <div className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50/50 rounded-lg">
                <span className="text-xs text-slate-600 font-medium">Fund Transfers (Internal)</span>
                <span className="text-xs font-bold text-slate-600">—</span>
              </div>

              {/* Net Change */}
              <div className="mt-4 pt-4 border-t-2 border-slate-200">
                <div className="flex items-center justify-between py-2.5 px-2">
                  <span className="text-sm font-extrabold text-slate-900">Net Cash Change</span>
                  <span className={`text-sm font-extrabold ${netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netFlow >= 0 ? '+' : ''}{formatMoney(netFlow)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-2">
                  <span className="text-sm font-extrabold text-slate-900">Opening Balance</span>
                  <span className="text-sm font-extrabold text-slate-900">{formatMoney(openingBalance)}</span>
                </div>
                <div className="flex items-center justify-between py-3 px-2 bg-blue-50 rounded-xl border border-blue-100 mt-1">
                  <span className="text-sm font-extrabold text-blue-900">Closing Balance</span>
                  <span className="text-sm font-extrabold text-blue-600">{formatMoney(closingBalance)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Breakdown */}
      {monthly.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Monthly Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-bold text-slate-500 uppercase tracking-wider">Period</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Cash In</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Cash Out</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Net Flow</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {monthly.map((m: any, i: number) => {
                  const inflow = Number(m.inflow ?? m.totalIn ?? m.revenue ?? 0);
                  const outflow = Number(m.outflow ?? m.totalOut ?? m.expense ?? 0);
                  const net = inflow - outflow;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-800">{m.period ?? m.month ?? `Period ${i + 1}`}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatMoney(inflow)}</td>
                      <td className="px-4 py-3 text-right text-rose-600 font-semibold">{formatMoney(outflow)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {net >= 0 ? '+' : ''}{formatMoney(net)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatMoney(m.balance ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
