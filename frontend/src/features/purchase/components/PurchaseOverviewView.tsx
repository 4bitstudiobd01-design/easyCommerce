'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  FileText,
  Clock,
  CreditCard,
  BarChart2,
  ClipboardList,
  Users,
  Plus,
  UserPlus,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  useGetPurchaseOverviewQuery,
  type PurchaseOrderStatus,
} from '../api/purchaseApi';
import { PurchaseTabsHeader, type PurchaseTabKey } from './PurchaseTabsHeader';

const money = (v: string | number) =>
  `৳ ${Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const deltaClass = (pct: string) =>
  Number(pct) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600';
const deltaArrow = (pct: string) => (Number(pct) >= 0 ? '↑' : '↓');

const PO_STATUS_META: Record<
  PurchaseOrderStatus,
  { label: string; color: string }
> = {
  DRAFT: { label: 'Draft', color: '#3B82F6' },
  SENT: { label: 'Sent', color: '#F97316' },
  PARTIALLY_RECEIVED: { label: 'Partially Received', color: '#FBBF24' },
  FULLY_RECEIVED: { label: 'Fully Received', color: '#10B981' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444' },
};

const MONTH_LABEL = (key: string) => {
  const [, m] = key.split('-');
  return [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][Number(m) - 1] ?? key;
};

const PAYMENT_BADGE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
  PARTIAL: 'bg-amber-50 text-amber-600 border border-amber-200/60',
  UNPAID: 'bg-rose-50 text-rose-600 border border-rose-200/60',
};
const PAYMENT_LABEL: Record<string, string> = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  UNPAID: 'Unpaid',
};

interface PurchaseOverviewViewProps {
  activeTab?: PurchaseTabKey;
  onNavigateTab?: (tab: PurchaseTabKey) => void;
}

export function PurchaseOverviewView({ activeTab = 'overview', onNavigateTab }: PurchaseOverviewViewProps = {}) {
  const { data, isLoading } = useGetPurchaseOverviewQuery();

  const trend = useMemo(
    () =>
      (data?.monthlyTrend ?? []).map((m) => ({
        month: MONTH_LABEL(m.month),
        amount: Number(m.amount),
        count: m.count,
      })),
    [data],
  );

  const donut = useMemo(
    () =>
      (data?.poStatusBreakdown ?? []).map((s) => ({
        name: PO_STATUS_META[s.status]?.label ?? s.status,
        value: s.count,
        count: s.count,
        percentage: `${Number(s.pct).toFixed(1)}%`,
        color: PO_STATUS_META[s.status]?.color ?? '#94A3B8',
      })),
    [data],
  );
  const donutTotal = donut.reduce((sum, d) => sum + d.value, 0);

  const kpis = data
    ? [
        {
          label: 'Total Purchases',
          value: money(data.kpis.totalPurchases.value),
          pct: data.kpis.totalPurchases.momPct,
          icon: ShoppingCart,
          tone: 'bg-blue-50 text-blue-600',
        },
        {
          label: 'Received Purchases',
          value: money(data.kpis.receivedPurchases.value),
          pct: data.kpis.receivedPurchases.momPct,
          icon: FileText,
          tone: 'bg-emerald-50 text-emerald-600',
        },
        {
          label: 'Pending Purchase Orders',
          value: String(data.kpis.pendingPurchaseOrders.value),
          pct: data.kpis.pendingPurchaseOrders.momPct,
          icon: Clock,
          tone: 'bg-amber-50 text-amber-500',
        },
        {
          label: 'Outstanding Supplier Due',
          value: money(data.kpis.outstandingSupplierDue.value),
          pct: data.kpis.outstandingSupplierDue.momPct,
          icon: CreditCard,
          tone: 'bg-purple-50 text-purple-600',
        },
      ]
    : [];

  const hasActivity =
    !!data &&
    (Number(data.kpis.totalPurchases.value) > 0 ||
      data.recentPurchases.length > 0 ||
      donutTotal > 0);


  return (
    <div className="space-y-6 pb-12 text-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Purchase Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Track your purchasing activities, supplier dues and stock inflow at a glance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/purchase?tab=suppliers"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && onNavigateTab) {
                e.preventDefault();
                onNavigateTab('suppliers');
              }
            }}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            <span>Add Supplier</span>
          </Link>

          <Link
            href="/dashboard/accounting/settings"
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Account Mapping</span>
          </Link>

          <Link
            href="/dashboard/purchase?tab=purchase-orders"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && onNavigateTab) {
                e.preventDefault();
                onNavigateTab('purchase-orders');
              }
            }}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Create Purchase Order</span>
          </Link>

          <Link
            href="/dashboard/purchase?tab=purchases"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && onNavigateTab) {
                e.preventDefault();
                onNavigateTab('purchases');
              }
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase</span>
          </Link>
        </div>
      </div>

      <PurchaseTabsHeader activeTab={activeTab} onTabChange={(tab) => onNavigateTab?.(tab)} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs h-24 animate-pulse"
            />
          ))}
        </div>
      ) : !hasActivity ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200/90 shadow-2xs text-center">
          <h2 className="text-base font-bold text-slate-900">No purchase activity yet</h2>
          <p className="text-xs text-slate-500 mt-1">
            Record your first purchase to see KPIs, trends and supplier dues here.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href="/dashboard/purchase?tab=purchases"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey && onNavigateTab) {
                  e.preventDefault();
                  onNavigateTab('purchases');
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Record a purchase
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${k.tone} flex items-center justify-center shrink-0`}
                >
                  <k.icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500">{k.label}</p>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {k.value}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${deltaClass(k.pct)}`}
                    >
                      {deltaArrow(k.pct)} {Math.abs(Number(k.pct)).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      vs last month
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-slate-600" />
                <h2 className="text-sm font-bold text-slate-900">Purchase Trend</h2>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={trend}
                    margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#F1F5F9"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                    />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      tickFormatter={(val) =>
                        val === 0 ? '0' : `৳ ${(val / 1000).toFixed(0)}K`
                      }
                    />
                    <YAxis yAxisId="right" orientation="right" hide />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'Purchase Amount')
                          return [
                            `৳ ${Number(value || 0).toLocaleString()}`,
                            'Amount',
                          ];
                        return [value, 'Purchases Count'];
                      }}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="amount"
                      name="Purchase Amount"
                      fill="#60A5FA"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={28}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="count"
                      name="Number of Purchases"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-slate-50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-600 font-medium">Purchase Amount</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 font-medium">Number of Purchases</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4 text-slate-600" />
                <h2 className="text-sm font-bold text-slate-900">Purchase Order Status</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 items-center gap-4 py-2">
                <div className="relative flex items-center justify-center h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donut}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {donut.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 leading-none">
                      {donutTotal}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Total POs
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {donut.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-600 truncate font-medium text-[11px]">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-semibold text-[11px]">
                        <span className="text-slate-800">{item.count}</span>
                        <span className="text-slate-400 w-9 text-right">
                          {item.percentage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/dashboard/purchase?tab=purchase-orders"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateTab) {
                      e.preventDefault();
                      onNavigateTab('purchase-orders');
                    }
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  View Detailed POs →
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <h2 className="text-sm font-bold text-slate-900">Recent Purchases</h2>
                </div>
                <Link
                  href="/dashboard/purchase?tab=purchases"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && onNavigateTab) {
                      e.preventDefault();
                      onNavigateTab('purchases');
                    }
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">PURCHASE NO</th>
                      <th className="px-4 py-3">SUPPLIER</th>
                      <th className="px-4 py-3">DATE</th>
                      <th className="px-4 py-3">ITEMS</th>
                      <th className="px-4 py-3">TOTAL</th>
                      <th className="px-4 py-3">PAID</th>
                      <th className="px-4 py-3">DUE</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {data.recentPurchases.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-8 text-center text-slate-400"
                        >
                          No purchases recorded yet.
                        </td>
                      </tr>
                    )}
                    {data.recentPurchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5 font-bold text-slate-900 font-mono text-[11px]">
                          {p.purchaseNo}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {p.supplier}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          {p.date}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {p.items}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {money(p.total)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 font-medium">
                          {money(p.paid)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 font-medium">
                          {money(p.due)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${PAYMENT_BADGE[p.status]}`}
                          >
                            {PAYMENT_LABEL[p.status] ?? p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Link
                            href="/dashboard/purchase?tab=purchases"
                            onClick={(e) => {
                              if (!e.metaKey && !e.ctrlKey && onNavigateTab) {
                                e.preventDefault();
                                onNavigateTab('purchases');
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition inline-flex"
                            title="Open in Purchases"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    <h2 className="text-sm font-bold text-slate-900">Top Suppliers</h2>
                  </div>
                  <Link
                    href="/dashboard/purchase?tab=suppliers"
                    onClick={(e) => {
                      if (!e.metaKey && !e.ctrlKey && onNavigateTab) {
                        e.preventDefault();
                        onNavigateTab('suppliers');
                      }
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/75 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-2.5">SUPPLIER</th>
                        <th className="px-4 py-2.5">TOTAL PURCHASE</th>
                        <th className="px-4 py-2.5">DUE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {data.topSuppliers.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-6 text-center text-slate-400"
                          >
                            No suppliers yet.
                          </td>
                        </tr>
                      )}
                      {data.topSuppliers.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {s.name}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {money(s.totalPurchase)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{money(s.due)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
