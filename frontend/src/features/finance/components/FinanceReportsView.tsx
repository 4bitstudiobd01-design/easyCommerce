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
  CheckCircle2,
  Building2,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  useGetProfitLossReportQuery,
  useGetCashFlowReportQuery,
  useGetReceivablesReportQuery,
  useGetPayablesReportQuery,
  useGetTrialBalanceReportQuery,
  useGetBalanceSheetReportQuery,
  useGetTaxVatReportQuery,
} from '../api/financeApi';

type ReportTab = 'PL' | 'BALANCE_SHEET' | 'TRIAL_BALANCE' | 'CASH_FLOW' | 'RECEIVABLES' | 'PAYABLES' | 'TAX_VAT';

function formatMoney(amount: number | string) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderGrowthBadge(rate?: number, isGoodWhenPositive: boolean = true) {
  if (rate === undefined || rate === 0) return null;
  const isPositive = rate > 0;
  const isGood = isGoodWhenPositive ? isPositive : !isPositive;

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
        isGood ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
      }`}
    >
      {isPositive ? '+' : ''}
      {rate.toFixed(1)}%
    </span>
  );
}

export function FinanceReportsView() {
  const [activeTab, setActiveTab] = useState<ReportTab>('PL');
  const [period, setPeriod] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const queryParams = {
    period: period !== 'custom' ? period : undefined,
    startDate: period === 'custom' ? startDate : undefined,
    endDate: period === 'custom' ? endDate : undefined,
  };

  const { data: plData, isLoading: plLoading } = useGetProfitLossReportQuery(queryParams, { skip: activeTab !== 'PL' });
  const { data: bsData, isLoading: bsLoading } = useGetBalanceSheetReportQuery(queryParams, { skip: activeTab !== 'BALANCE_SHEET' });
  const { data: tbData, isLoading: tbLoading } = useGetTrialBalanceReportQuery(queryParams, { skip: activeTab !== 'TRIAL_BALANCE' });
  const { data: cfData, isLoading: cfLoading } = useGetCashFlowReportQuery(queryParams, { skip: activeTab !== 'CASH_FLOW' });
  const { data: taxData, isLoading: taxLoading } = useGetTaxVatReportQuery(queryParams, { skip: activeTab !== 'TAX_VAT' });
  const { data: receivablesData, isLoading: recLoading } = useGetReceivablesReportQuery(undefined, { skip: activeTab !== 'RECEIVABLES' });
  const { data: payablesData, isLoading: payLoading } = useGetPayablesReportQuery(undefined, { skip: activeTab !== 'PAYABLES' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Reports & Statements</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Double-entry GAAP/IFRS compliant financial reporting suite with period comparisons
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab !== 'RECEIVABLES' && activeTab !== 'PAYABLES' && (
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        {[
          { id: 'PL', label: 'Profit & Loss (P&L)', icon: FileText },
          { id: 'BALANCE_SHEET', label: 'Balance Sheet', icon: Scale },
          { id: 'TRIAL_BALANCE', label: 'Trial Balance', icon: ShieldCheck },
          { id: 'CASH_FLOW', label: 'Cash Flow', icon: Landmark },
          { id: 'RECEIVABLES', label: 'AR Aging', icon: TrendingUp },
          { id: 'PAYABLES', label: 'AP Aging', icon: TrendingDown },
          { id: 'TAX_VAT', label: 'Tax & VAT Filing', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── 1. PROFIT & LOSS REPORT ─────────────────────────────── */}
      {activeTab === 'PL' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900">Profit & Loss Statement (Income Statement)</h2>
              <p className="text-xs text-slate-500 font-medium">
                Period: {plData?.dateRange?.startDate || '—'} to {plData?.dateRange?.endDate || '—'}
              </p>
            </div>
            {plData?.growth && (
              <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600">Revenue Growth:</span>
                {renderGrowthBadge(plData.growth.revenueGrowth, true)}
                <span className="text-xs font-bold text-slate-600 ml-2">Net Profit Growth:</span>
                {renderGrowthBadge(plData.growth.netProfitGrowth, true)}
              </div>
            )}
          </div>

          {plLoading ? (
            <div className="py-12 text-center text-slate-400">Loading Profit & Loss...</div>
          ) : plData ? (
            <div className="space-y-6 text-sm">
              {/* REVENUE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-black text-slate-900 border-b border-slate-200 pb-2">
                  <span className="uppercase text-xs tracking-wider text-slate-500">1. Operating Revenue</span>
                  <span className="text-emerald-700 font-mono text-base">
                    {formatMoney(plData.current?.revenue?.totalRevenue || 0)}
                  </span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>E-Commerce Product Sales</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.revenue?.productSales || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery & Shipping Income</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.revenue?.shippingIncome || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Operating Income</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.revenue?.otherIncome || 0)}
                    </span>
                  </div>
                  {Number(plData.current?.revenue?.salesDiscounts || 0) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Less: Sales Discounts & Coupons</span>
                      <span className="font-mono font-bold">
                        -{formatMoney(plData.current.revenue.salesDiscounts)}
                      </span>
                    </div>
                  )}
                  {Number(plData.current?.revenue?.salesReturns || 0) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Less: Customer Returns & Refunds</span>
                      <span className="font-mono font-bold">
                        -{formatMoney(plData.current.revenue.salesReturns)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* COGS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-black text-slate-900 border-b border-slate-200 pb-2">
                  <span className="uppercase text-xs tracking-wider text-slate-500">2. Cost of Goods Sold (COGS)</span>
                  <span className="text-amber-700 font-mono text-base">
                    {formatMoney(plData.current?.cogs?.totalCogs || 0)}
                  </span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Direct Product Inventory Cost</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.cogs?.productCost || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packaging & Supplies</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.cogs?.packaging || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Gateway Processing Fees</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.cogs?.gatewayFees || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Courier & Delivery Fees</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.cogs?.shippingFees || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* GROSS PROFIT HIGHLIGHT */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between font-black">
                <div>
                  <span className="text-indigo-950 text-sm">GROSS PROFIT</span>
                  <span className="ml-3 text-xs text-indigo-700 font-bold">
                    ({plData.current?.grossMarginPercent || 0}% Gross Margin)
                  </span>
                </div>
                <span className="text-xl font-mono text-indigo-950">
                  {formatMoney(plData.current?.grossProfit || 0)}
                </span>
              </div>

              {/* OPERATING EXPENSES (OPEX) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-black text-slate-900 border-b border-slate-200 pb-2">
                  <span className="uppercase text-xs tracking-wider text-slate-500">3. Operating Expenses (OPEX)</span>
                  <span className="text-rose-700 font-mono text-base">
                    {formatMoney(plData.current?.operatingExpenses?.totalOperatingExpenses || 0)}
                  </span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Employee Salaries & Payroll</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.operatingExpenses?.salary || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marketing & Advertising Campaigns</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.operatingExpenses?.marketing || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Software & SaaS Subscriptions</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.operatingExpenses?.software || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rent & Office Operations</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.operatingExpenses?.rent || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilities & Internet</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.operatingExpenses?.utilities || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bank & Financial Charges</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.operatingExpenses?.bankFees || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>General & Miscellaneous Expenses</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(plData.current?.operatingExpenses?.other || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* NET PROFIT HIGHLIGHT */}
              <div
                className={`p-5 rounded-2xl border flex items-center justify-between font-black ${
                  (plData.current?.netProfit || 0) >= 0
                    ? 'bg-teal-50 border-teal-300 text-teal-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div>
                  <span className="text-base">NET PROFIT / (NET LOSS)</span>
                  <span className="ml-3 text-xs font-bold">
                    ({plData.current?.netMarginPercent || 0}% Net Margin)
                  </span>
                </div>
                <span className="text-2xl font-mono">
                  {formatMoney(plData.current?.netProfit || 0)}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ─── 2. BALANCE SHEET ────────────────────────────────────── */}
      {activeTab === 'BALANCE_SHEET' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900">Balance Sheet Statement</h2>
              <p className="text-xs text-slate-500 font-medium">
                As of {bsData?.asOfDate || bsData?.dateRange?.endDate || '—'}
              </p>
            </div>
            {bsData?.isBalanced ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Assets = Liabilities + Equity (Balanced)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Out of Balance by ৳{(bsData?.difference ?? 0).toFixed(2)}
              </span>
            )}
          </div>

          {bsLoading ? (
            <div className="py-12 text-center text-slate-400">Loading Balance Sheet...</div>
          ) : bsData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
              {/* ASSETS COLUMN */}
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex justify-between font-black text-blue-950 text-sm">
                  <span>TOTAL ASSETS</span>
                  <span className="font-mono">{formatMoney(bsData.assets?.totalAssets || 0)}</span>
                </div>

                <div className="space-y-3">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Current Assets</span>
                  <div className="space-y-2 pl-2">
                    {(bsData.assets?.currentAssets || []).map((item) => (
                      <div key={item.id} className="flex justify-between text-slate-700 font-medium">
                        <span>{item.code} — {item.name}</span>
                        <span className="font-mono font-bold">{formatMoney(item.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1.5">
                      <span>Total Current Assets</span>
                      <span className="font-mono">{formatMoney(bsData.assets?.totalCurrentAssets || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIABILITIES & EQUITY COLUMN */}
              <div className="space-y-6">
                {/* Liabilities */}
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 flex justify-between font-black text-amber-950 text-sm">
                    <span>TOTAL LIABILITIES</span>
                    <span className="font-mono">{formatMoney(bsData.liabilities?.totalLiabilities || 0)}</span>
                  </div>
                  <div className="space-y-2 pl-2">
                    {(bsData.liabilities?.currentLiabilities || []).map((item) => (
                      <div key={item.id} className="flex justify-between text-slate-700 font-medium">
                        <span>{item.code} — {item.name}</span>
                        <span className="font-mono font-bold">{formatMoney(item.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1.5">
                      <span>Total Current Liabilities</span>
                      <span className="font-mono">{formatMoney(bsData.liabilities?.totalCurrentLiabilities || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Equity */}
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 flex justify-between font-black text-purple-950 text-sm">
                    <span>TOTAL EQUITY</span>
                    <span className="font-mono">{formatMoney(bsData.equity?.totalEquity || 0)}</span>
                  </div>
                  <div className="space-y-2 pl-2">
                    {(bsData.equity?.equityItems || []).map((item) => (
                      <div key={item.id} className="flex justify-between text-slate-700 font-medium">
                        <span>{item.code} — {item.name}</span>
                        <span className="font-mono font-bold">{formatMoney(item.balance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-teal-700 font-bold">
                      <span>Current Period Net Income</span>
                      <span className="font-mono">{formatMoney(bsData.equity?.currentPeriodNetIncome || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1.5">
                      <span>Total Equity</span>
                      <span className="font-mono">{formatMoney(bsData.equity?.totalEquity || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Total Liabilities & Equity Check */}
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex justify-between font-black text-sm">
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span className="font-mono">{formatMoney(bsData.totalLiabilitiesAndEquity || 0)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ─── 3. TRIAL BALANCE ────────────────────────────────────── */}
      {activeTab === 'TRIAL_BALANCE' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900">Trial Balance Verification</h2>
              <p className="text-xs text-slate-500 font-medium">
                As of {tbData?.asOfDate || tbData?.dateRange?.endDate || '—'}
              </p>
            </div>
            {tbData?.isBalanced ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Debits = Credits (Balanced: {formatMoney(tbData?.totalDebit || 0)})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Trial Balance Difference: ৳{(tbData?.difference ?? 0).toFixed(2)}
              </span>
            )}
          </div>

          {tbLoading ? (
            <div className="py-12 text-center text-slate-400">Loading Trial Balance...</div>
          ) : tbData ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4 text-right">Debit Balance (Dr)</th>
                    <th className="py-3 px-4 text-right">Credit Balance (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(tbData.accounts || []).map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{acc.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{acc.name}</td>
                      <td className="py-3 px-4 text-slate-500 font-semibold">{acc.accountClass}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                        {acc.debitBalance > 0 ? formatMoney(acc.debitBalance) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                        {acc.creditBalance > 0 ? formatMoney(acc.creditBalance) : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white font-black text-sm">
                    <td colSpan={3} className="py-4 px-4 uppercase tracking-wider">
                      Total Trial Balance Equality
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-blue-300">
                      {formatMoney(tbData.totalDebit || 0)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-purple-300">
                      {formatMoney(tbData.totalCredit || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {/* ─── 4. CASH FLOW STATEMENT ──────────────────────────────── */}
      {activeTab === 'CASH_FLOW' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Statement of Cash Flows</h2>
            <p className="text-xs text-slate-500 font-medium">
              Period: {cfData?.dateRange?.startDate || '—'} to {cfData?.dateRange?.endDate || '—'}
            </p>
          </div>

          {cfLoading ? (
            <div className="py-12 text-center text-slate-400">Loading Cash Flow...</div>
          ) : cfData ? (
            <div className="space-y-6 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between font-black text-slate-900 border-b border-slate-200 pb-2">
                  <span className="uppercase text-xs tracking-wider text-slate-500">1. Operating Activities</span>
                  <span className="font-mono text-base">
                    {formatMoney(cfData.operatingActivities?.netCashFlow || 0)}
                  </span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Cash Inflows from Sales & Invoices</span>
                    <span className="font-mono">
                      +{formatMoney(cfData.operatingActivities?.cashInflow || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>Cash Outflows for Suppliers, Payroll & OPEX</span>
                    <span className="font-mono">
                      -{formatMoney(cfData.operatingActivities?.cashOutflow || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between font-black text-slate-900 border-b border-slate-200 pb-2">
                  <span className="uppercase text-xs tracking-wider text-slate-500">2. Investing Activities</span>
                  <span className="font-mono text-base">
                    {formatMoney(cfData.investingActivities?.netCashFlow || 0)}
                  </span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Capital Equipment & Asset Purchases</span>
                    <span className="font-mono">
                      {formatMoney(cfData.investingActivities?.netCashFlow || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between font-black text-slate-900 border-b border-slate-200 pb-2">
                  <span className="uppercase text-xs tracking-wider text-slate-500">3. Financing Activities</span>
                  <span className="font-mono text-base">
                    {formatMoney(cfData.financingActivities?.netCashFlow || 0)}
                  </span>
                </div>
                <div className="pl-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Owner Capital & Financing Flows</span>
                    <span className="font-mono">
                      {formatMoney(cfData.financingActivities?.netCashFlow || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-teal-50 border border-teal-300 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Beginning Cash & Bank Balance</span>
                  <span className="font-mono font-bold">
                    {formatMoney(cfData.summary?.beginningCashBalance || 0)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-teal-800">
                  <span>Net Change in Cash</span>
                  <span className="font-mono">
                    {formatMoney(cfData.summary?.netChangeInCash || 0)}
                  </span>
                </div>
                <div className="flex justify-between font-black text-teal-950 text-base border-t border-teal-200 pt-2">
                  <span>Ending Cash & Bank Balance</span>
                  <span className="font-mono">
                    {formatMoney(cfData.summary?.endingCashBalance || 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ─── 5. ACCOUNTS RECEIVABLE (AR) AGING ───────────────────── */}
      {activeTab === 'RECEIVABLES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Accounts Receivable (AR) Aging Analysis</h2>
            <p className="text-xs text-slate-500 font-medium">Customer invoice aging and outstanding collections</p>
          </div>

          {recLoading ? (
            <div className="py-12 text-center text-slate-400">Loading AR Aging...</div>
          ) : receivablesData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Current (0-30 Days)</span>
                  <p className="text-base font-black text-slate-900 mt-1">
                    {formatMoney(receivablesData.aging?.days1To30 || 0)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">31-60 Days</span>
                  <p className="text-base font-black text-amber-700 mt-1">
                    {formatMoney(receivablesData.aging?.days31To60 || 0)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">61-90 Days</span>
                  <p className="text-base font-black text-rose-600 mt-1">
                    {formatMoney(receivablesData.aging?.days61To90 || 0)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">90+ Days Overdue</span>
                  <p className="text-base font-black text-rose-800 mt-1">
                    {formatMoney(receivablesData.aging?.over90Days || 0)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                  <span className="text-[10px] font-bold uppercase text-blue-800">Total Receivables</span>
                  <p className="text-base font-black text-blue-950 mt-1">
                    {formatMoney(receivablesData.aging?.totalReceivables || 0)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ─── 6. ACCOUNTS PAYABLE (AP) AGING ─────────────────────── */}
      {activeTab === 'PAYABLES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Accounts Payable (AP) Aging Analysis</h2>
            <p className="text-xs text-slate-500 font-medium">Vendor bill aging and upcoming payment obligations</p>
          </div>

          {payLoading ? (
            <div className="py-12 text-center text-slate-400">Loading AP Aging...</div>
          ) : payablesData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Current (0-30 Days)</span>
                  <p className="text-base font-black text-slate-900 mt-1">
                    {formatMoney(payablesData.aging?.days1To30 || 0)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">31-60 Days</span>
                  <p className="text-base font-black text-amber-700 mt-1">
                    {formatMoney(payablesData.aging?.days31To60 || 0)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">61-90 Days</span>
                  <p className="text-base font-black text-rose-600 mt-1">
                    {formatMoney(payablesData.aging?.days61To90 || 0)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400">90+ Days Overdue</span>
                  <p className="text-base font-black text-rose-800 mt-1">
                    {formatMoney(payablesData.aging?.over90Days || 0)}
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                  <span className="text-[10px] font-bold uppercase text-amber-800">Total Payables</span>
                  <p className="text-base font-black text-amber-950 mt-1">
                    {formatMoney(payablesData.aging?.totalPayables || 0)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ─── 7. TAX / VAT REPORT ─────────────────────────────────── */}
      {activeTab === 'TAX_VAT' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">Tax & VAT Summary Filing Report</h2>
            <p className="text-xs text-slate-500 font-medium">Output VAT collected vs Input VAT paid</p>
          </div>

          {taxLoading ? (
            <div className="py-12 text-center text-slate-400">Loading Tax/VAT Report...</div>
          ) : taxData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
                  <span className="text-[11px] font-bold uppercase text-emerald-800">Output VAT Collected</span>
                  <p className="text-2xl font-black text-emerald-950 mt-1">
                    {formatMoney(taxData.summary?.outputVatCollected || 0)}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    From ৳{(taxData.summary?.totalTaxableSales || 0).toLocaleString()} sales
                  </span>
                </div>

                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200">
                  <span className="text-[11px] font-bold uppercase text-blue-800">Input VAT Paid</span>
                  <p className="text-2xl font-black text-blue-950 mt-1">
                    {formatMoney(taxData.summary?.inputVatPaid || 0)}
                  </p>
                  <span className="text-[10px] text-blue-700 font-semibold">
                    From ৳{(taxData.summary?.totalTaxablePurchases || 0).toLocaleString()} purchases
                  </span>
                </div>

                <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200">
                  <span className="text-[11px] font-bold uppercase text-purple-800">Net VAT Payable</span>
                  <p className="text-2xl font-black text-purple-950 mt-1">
                    {formatMoney(taxData.summary?.netVatPayable || 0)}
                  </p>
                  <span className="text-[10px] text-purple-700 font-bold">Owed to Revenue Authority</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
