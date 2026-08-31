'use client';

import React, { useState } from 'react';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
  Landmark,
  Receipt,
  Printer,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  useGetProfitLossReportQuery,
  useGetCashFlowReportQuery,
  useGetReceivablesReportQuery,
  useGetPayablesReportQuery,
} from '../api/financeApi';

type ReportTab = 'PL' | 'CASH_FLOW' | 'RECEIVABLES' | 'PAYABLES';

export function FinanceReportsView() {
  const [activeTab, setActiveTab] = useState<ReportTab>('PL');
  const [period, setPeriod] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data: plData, isLoading: plLoading } = useGetProfitLossReportQuery(
    {
      period: period !== 'custom' ? period : undefined,
      startDate: period === 'custom' ? startDate : undefined,
      endDate: period === 'custom' ? endDate : undefined,
    },
    { skip: activeTab !== 'PL' },
  );

  const { data: cashFlowData, isLoading: cfLoading } = useGetCashFlowReportQuery(
    {
      period: period !== 'custom' ? period : undefined,
      startDate: period === 'custom' ? startDate : undefined,
      endDate: period === 'custom' ? endDate : undefined,
    },
    { skip: activeTab !== 'CASH_FLOW' },
  );

  const { data: receivablesData, isLoading: recLoading } = useGetReceivablesReportQuery(
    undefined,
    { skip: activeTab !== 'RECEIVABLES' },
  );

  const { data: payablesData, isLoading: payLoading } = useGetPayablesReportQuery(
    undefined,
    { skip: activeTab !== 'PAYABLES' },
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Reports</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Profit & loss statement, cash flow ledger, and accounts aging analysis
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(activeTab === 'PL' || activeTab === 'CASH_FLOW') && (
            <div className="flex items-center gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>

              {period === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('PL')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'PL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Profit & Loss Statement
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CASH_FLOW')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'CASH_FLOW'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Cash Flow Report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RECEIVABLES')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'RECEIVABLES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Accounts Receivable Aging
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PAYABLES')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'PAYABLES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Accounts Payable Aging
        </button>
      </div>

      {/* Tab 1: Profit & Loss Statement */}
      {activeTab === 'PL' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900">Profit & Loss Statement (P&L)</h2>
            <p className="text-xs text-slate-500 font-medium">
              Period: {plData?.dateRange.startDate} to {plData?.dateRange.endDate}
            </p>
          </div>

          {plLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
              Computing financial ledger...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Revenue Section */}
              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-2 rounded-lg">
                  1. Operating Revenue
                </h3>
                <div className="mt-2 divide-y divide-slate-100 text-sm">
                  <div className="py-2.5 px-3 flex justify-between text-slate-700">
                    <span>Product Sales</span>
                    <span className="font-mono font-medium">
                      ৳{Number(plData?.revenue.productSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="py-2.5 px-3 flex justify-between text-slate-700">
                    <span>Shipping Revenue</span>
                    <span className="font-mono font-medium">
                      ৳{Number(plData?.revenue.shippingIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="py-2.5 px-3 flex justify-between text-slate-700">
                    <span>Other Income</span>
                    <span className="font-mono font-medium">
                      ৳{Number(plData?.revenue.otherIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="py-3 px-3 flex justify-between font-bold text-slate-900 bg-slate-50 rounded-lg">
                    <span>Total Operating Revenue</span>
                    <span className="font-mono text-emerald-600">
                      ৳{Number(plData?.revenue.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* COGS & Gross Profit */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-2 rounded-lg">
                  2. Cost of Goods Sold (COGS)
                </h3>
                <div className="mt-2 divide-y divide-slate-100 text-sm">
                  <div className="py-2.5 px-3 flex justify-between text-slate-700">
                    <span>Cost of Goods / Direct Product Cost</span>
                    <span className="font-mono text-rose-600">
                      -৳{Number(plData?.cogs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="py-3 px-3 flex justify-between font-black text-slate-900 bg-blue-50/50 rounded-lg">
                    <span>
                      Gross Profit ({plData?.grossMarginPercent.toFixed(1)}% Gross Margin)
                    </span>
                    <span className="font-mono text-blue-700 text-base">
                      ৳{Number(plData?.grossProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operating Expenses */}
              <div>
                <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider bg-rose-50 px-3 py-2 rounded-lg">
                  3. Operating Expenses (OPEX)
                </h3>
                <div className="mt-2 divide-y divide-slate-100 text-sm">
                  <div className="py-2 px-3 flex justify-between text-slate-700">
                    <span>Marketing & Advertising</span>
                    <span className="font-mono">
                      ৳{Number(plData?.operatingExpenses.marketing || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="py-2 px-3 flex justify-between text-slate-700">
                    <span>Salaries & Payroll</span>
                    <span className="font-mono">
                      ৳{Number(plData?.operatingExpenses.salary || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="py-2 px-3 flex justify-between text-slate-700">
                    <span>Employee Expenses (HR Reimbursements)</span>
                    <span className="font-mono">
                      ৳{Number(plData?.operatingExpenses.employeeExpenses || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="py-2 px-3 flex justify-between text-slate-700">
                    <span>Rent & Office Space</span>
                    <span className="font-mono">
                      ৳{Number(plData?.operatingExpenses.rent || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="py-2 px-3 flex justify-between text-slate-700">
                    <span>Utilities</span>
                    <span className="font-mono">
                      ৳{Number(plData?.operatingExpenses.utilities || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="py-2 px-3 flex justify-between text-slate-700">
                    <span>Software & SaaS Tools</span>
                    <span className="font-mono">
                      ৳{Number(plData?.operatingExpenses.software || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="py-2 px-3 flex justify-between text-slate-700">
                    <span>Shipping & Courier Cost</span>
                    <span className="font-mono">
                      ৳{Number(plData?.operatingExpenses.shipping || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="py-2 px-3 flex justify-between text-slate-700">
                    <span>Other Operating Costs</span>
                    <span className="font-mono">
                      ৳{Number(plData?.operatingExpenses.other || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="py-3 px-3 flex justify-between font-bold text-slate-900 bg-slate-50 rounded-lg">
                    <span>Total Operating Expenses</span>
                    <span className="font-mono text-rose-600">
                      ৳{Number(plData?.operatingExpenses.totalOperatingExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Profit Callout */}
              <div
                className={`p-6 rounded-2xl flex items-center justify-between ${
                  Number(plData?.netProfit || 0) >= 0
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider opacity-90">
                    Net Profit (Net Margin: {plData?.netMarginPercent.toFixed(1)}%)
                  </p>
                  <p className="text-3xl font-black mt-1 font-mono">
                    ৳{Number(plData?.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Scale className="w-10 h-10 opacity-80" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Cash Flow Report */}
      {activeTab === 'CASH_FLOW' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900">Cash Flow Report</h2>
            <p className="text-xs text-slate-500 font-medium">
              Period: {cashFlowData?.dateRange.startDate} to {cashFlowData?.dateRange.endDate}
            </p>
          </div>

          {cfLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
              Computing cash flow analysis...
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-700 uppercase">Total Cash Inflow</p>
                  <p className="text-2xl font-black text-emerald-800 mt-1">
                    +৳{Number(cashFlowData?.totalInflow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                  <p className="text-xs font-bold text-rose-700 uppercase">Total Cash Outflow</p>
                  <p className="text-2xl font-black text-rose-800 mt-1">
                    -৳{Number(cashFlowData?.totalOutflow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                  <p className="text-xs font-bold text-blue-700 uppercase">Net Cash Flow</p>
                  <p className="text-2xl font-black text-blue-800 mt-1">
                    ৳{Number(cashFlowData?.netCashFlow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-5 bg-slate-900 text-white rounded-2xl">
                  <p className="text-xs font-bold text-slate-300 uppercase">Total Liquid Balance</p>
                  <p className="text-2xl font-black mt-1">
                    ৳{Number(cashFlowData?.currentTotalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Account-Wise Cash Inflows & Outflows
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="px-5 py-3.5">Account</th>
                        <th className="px-5 py-3.5">Type</th>
                        <th className="px-5 py-3.5 text-right">Inflow (+)</th>
                        <th className="px-5 py-3.5 text-right">Outflow (-)</th>
                        <th className="px-5 py-3.5 text-right">Net Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cashFlowData?.accountsSummary.map((acc) => (
                        <tr key={acc.accountId} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5 text-xs font-bold text-slate-900">
                            {acc.accountName}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-500 uppercase">
                            {acc.accountType.replace('_', ' ')}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono font-bold text-right text-emerald-600">
                            +৳{Number(acc.inflow).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono font-bold text-right text-rose-600">
                            -৳{Number(acc.outflow).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td
                            className={`px-5 py-3.5 text-xs font-mono font-bold text-right ${
                              Number(acc.netChange) >= 0 ? 'text-blue-600' : 'text-rose-600'
                            }`}
                          >
                            ৳{Number(acc.netChange).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Accounts Receivable Aging */}
      {activeTab === 'RECEIVABLES' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900">Accounts Receivable Aging</h2>
            <p className="text-xs text-slate-500 font-medium">
              Outstanding customer invoices categorized by payment overdue age
            </p>
          </div>

          {recLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
              Loading receivables...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Aging Buckets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase">Current (Not Due)</p>
                  <p className="text-lg font-black text-emerald-800 mt-1">
                    ৳{Number(receivablesData?.aging.current || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-[11px] font-bold text-amber-700 uppercase">1 - 30 Days Overdue</p>
                  <p className="text-lg font-black text-amber-800 mt-1">
                    ৳{Number(receivablesData?.aging.days1To30 || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                  <p className="text-[11px] font-bold text-orange-700 uppercase">31 - 60 Days</p>
                  <p className="text-lg font-black text-orange-800 mt-1">
                    ৳{Number(receivablesData?.aging.days31To60 || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <p className="text-[11px] font-bold text-rose-700 uppercase">61 - 90 Days</p>
                  <p className="text-lg font-black text-rose-800 mt-1">
                    ৳{Number(receivablesData?.aging.days61To90 || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-rose-100/70 border border-rose-200 rounded-xl">
                  <p className="text-[11px] font-bold text-rose-900 uppercase">&gt; 90 Days Overdue</p>
                  <p className="text-lg font-black text-rose-900 mt-1">
                    ৳{Number(receivablesData?.aging.over90Days || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-slate-900 text-white rounded-xl">
                  <p className="text-[11px] font-bold text-slate-300 uppercase">Total Receivables</p>
                  <p className="text-lg font-black mt-1">
                    ৳{Number(receivablesData?.aging.totalReceivables || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Invoices List */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Uncollected Invoices ({receivablesData?.invoices.length})
                </h3>
                {receivablesData?.invoices.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs">
                    All customer invoices are fully settled! No outstanding receivables.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                        <tr>
                          <th className="px-5 py-3.5">Invoice #</th>
                          <th className="px-5 py-3.5">Customer</th>
                          <th className="px-5 py-3.5">Due Date</th>
                          <th className="px-5 py-3.5">Aging Bracket</th>
                          <th className="px-5 py-3.5 text-right">Invoice Total</th>
                          <th className="px-5 py-3.5 text-right">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {receivablesData?.invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="px-5 py-3.5 text-xs font-mono font-bold text-blue-600">
                              #{inv.invoiceNumber}
                            </td>
                            <td className="px-5 py-3.5 text-xs font-bold text-slate-900">
                              {inv.customerName}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-600">{inv.dueDate}</td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  inv.bucket === 'Current'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {inv.bucket} {inv.daysOverdue > 0 ? `(${inv.daysOverdue}d)` : ''}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs font-mono text-right text-slate-700">
                              ৳{Number(inv.totalAmount).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-xs font-mono font-bold text-right text-rose-600">
                              ৳{Number(inv.balanceDue).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Accounts Payable Aging */}
      {activeTab === 'PAYABLES' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900">Accounts Payable Aging</h2>
            <p className="text-xs text-slate-500 font-medium">
              Outstanding supplier and vendor bills categorized by overdue age
            </p>
          </div>

          {payLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
              Loading payables...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Aging Buckets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase">Current (Not Due)</p>
                  <p className="text-lg font-black text-emerald-800 mt-1">
                    ৳{Number(payablesData?.aging.current || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-[11px] font-bold text-amber-700 uppercase">1 - 30 Days Overdue</p>
                  <p className="text-lg font-black text-amber-800 mt-1">
                    ৳{Number(payablesData?.aging.days1To30 || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                  <p className="text-[11px] font-bold text-orange-700 uppercase">31 - 60 Days</p>
                  <p className="text-lg font-black text-orange-800 mt-1">
                    ৳{Number(payablesData?.aging.days31To60 || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <p className="text-[11px] font-bold text-rose-700 uppercase">61 - 90 Days</p>
                  <p className="text-lg font-black text-rose-800 mt-1">
                    ৳{Number(payablesData?.aging.days61To90 || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-rose-100/70 border border-rose-200 rounded-xl">
                  <p className="text-[11px] font-bold text-rose-900 uppercase">&gt; 90 Days Overdue</p>
                  <p className="text-lg font-black text-rose-900 mt-1">
                    ৳{Number(payablesData?.aging.over90Days || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-slate-900 text-white rounded-xl">
                  <p className="text-[11px] font-bold text-slate-300 uppercase">Total Payables</p>
                  <p className="text-lg font-black mt-1">
                    ৳{Number(payablesData?.aging.totalPayables || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Bills List */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Unpaid Supplier Bills ({payablesData?.bills.length})
                </h3>
                {payablesData?.bills.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs">
                    No outstanding vendor payables found!
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                        <tr>
                          <th className="px-5 py-3.5">Bill #</th>
                          <th className="px-5 py-3.5">Supplier</th>
                          <th className="px-5 py-3.5">Due Date</th>
                          <th className="px-5 py-3.5">Aging Bracket</th>
                          <th className="px-5 py-3.5 text-right">Bill Total</th>
                          <th className="px-5 py-3.5 text-right">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payablesData?.bills.map((bill) => (
                          <tr key={bill.id} className="hover:bg-slate-50">
                            <td className="px-5 py-3.5 text-xs font-mono font-bold text-amber-600">
                              #{bill.billNumber}
                            </td>
                            <td className="px-5 py-3.5 text-xs font-bold text-slate-900">
                              {bill.supplierName}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-600">{bill.dueDate}</td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  bill.bucket === 'Current'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {bill.bucket} {bill.daysOverdue > 0 ? `(${bill.daysOverdue}d)` : ''}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs font-mono text-right text-slate-700">
                              ৳{Number(bill.totalAmount).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-xs font-mono font-bold text-right text-rose-600">
                              ৳{Number(bill.balanceDue).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
