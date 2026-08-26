'use client';

import React from 'react';
import { CrmAnalyticsMetrics } from '../../types/crm.types';
import {
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Repeat,
  Sparkles,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  ExternalLink,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { formatCrmDate } from '../../utils/formatDate';

interface CrmAnalyticsDashboardProps {
  metrics: CrmAnalyticsMetrics;
}

function StatCard({
  title,
  value,
  sub,
  icon,
  trendUp,
  trendLabel,
  accentBg,
  accentText,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trendUp?: boolean | null;
  trendLabel?: string;
  accentBg: string;
  accentText: string;
}) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
      <div className="flex items-center justify-between text-slate-500">
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-xl ${accentBg} ${accentText}`}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-slate-900">{value}</span>
        {sub && <span className="text-xs text-slate-400 font-medium">{sub}</span>}
      </div>
      {trendLabel && (
        <span
          className={`text-[11px] font-bold flex items-center gap-1 ${
            trendUp === true
              ? 'text-emerald-600'
              : trendUp === false
              ? 'text-red-500'
              : 'text-slate-400'
          }`}
        >
          {trendUp === true ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : trendUp === false ? (
            <ArrowDownRight className="w-3.5 h-3.5" />
          ) : null}
          {trendLabel}
        </span>
      )}
    </div>
  );
}

export const CrmAnalyticsDashboard: React.FC<CrmAnalyticsDashboardProps> = ({ metrics }) => {
  const totalRfm =
    (metrics.rfmBreakdown?.vip || 0) +
    (metrics.rfmBreakdown?.loyal || 0) +
    (metrics.rfmBreakdown?.promising || 0) +
    (metrics.rfmBreakdown?.atRisk || 0) +
    (metrics.rfmBreakdown?.dormant || 0) || 1;

  return (
    <div className="space-y-6">
      {/* ── Top 4 KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Customers"
          value={metrics.activeCustomers.toLocaleString()}
          sub={`/ ${metrics.totalCustomers} total`}
          icon={<Users className="w-4 h-4" />}
          trendUp={true}
          trendLabel={`${metrics.newCustomers} new this period`}
          accentBg="bg-blue-50"
          accentText="text-blue-600"
        />
        <StatCard
          title="Avg Customer LTV"
          value={`৳${metrics.avgCustomerLtv.toLocaleString()}`}
          icon={<DollarSign className="w-4 h-4" />}
          trendUp={metrics.avgCustomerLtv > 5000}
          trendLabel={`Avg Order: ৳${(metrics.avgOrderValue || 0).toLocaleString()}`}
          accentBg="bg-purple-50"
          accentText="text-purple-600"
        />
        <StatCard
          title="Repeat Purchase Rate"
          value={`${metrics.repeatPurchaseRate}%`}
          icon={<Repeat className="w-4 h-4" />}
          trendUp={metrics.repeatPurchaseRate >= 30}
          trendLabel={`${metrics.repeatCustomers} repeat buyers · Benchmark >30%`}
          accentBg="bg-emerald-50"
          accentText="text-emerald-600"
        />
        <StatCard
          title="Leads Pipeline Value"
          value={`৳${(metrics.pipelineValue || 0).toLocaleString()}`}
          icon={<Target className="w-4 h-4" />}
          trendUp={metrics.leadConversionRate > 10}
          trendLabel={`${metrics.leadConversionRate}% Win Rate · ${metrics.totalLeads} total leads`}
          accentBg="bg-amber-50"
          accentText="text-amber-600"
        />
      </div>

      {/* ── Secondary KPIs ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</p>
          <p className="text-xl font-black text-slate-900">৳{(metrics.totalRevenue || 0).toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">All completed orders</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Converted Leads</p>
          <p className="text-xl font-black text-indigo-700">{metrics.convertedLeads} / {metrics.totalLeads}</p>
          <p className="text-[10px] text-slate-400">WON leads</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Churn Risk Rate</p>
          <p className={`text-xl font-black ${metrics.churnRate > 20 ? 'text-red-600' : 'text-emerald-700'}`}>
            {metrics.churnRate}%
          </p>
          <p className="text-[10px] text-slate-400">Inactive &gt;90 days</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New Customers</p>
          <p className="text-xl font-black text-blue-700">{metrics.newCustomers}</p>
          <p className="text-[10px] text-slate-400">This period</p>
        </div>
      </div>

      {/* ── RFM Grid & Acquisition Channels ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* RFM Customer Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">RFM Customer Segmentation Grid</h3>
              <p className="text-xs text-slate-400">Recency, Frequency, and Monetary distribution</p>
            </div>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-bold">
              Live RFM
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                label: '🌟 VIP Big Spenders',
                count: metrics.rfmBreakdown?.vip || 0,
                color: 'bg-purple-600',
                desc: 'High spend (≥₳20,000) with 3+ completed orders',
              },
              {
                label: '🔁 Loyal Repeat Shoppers',
                count: metrics.rfmBreakdown?.loyal || 0,
                color: 'bg-blue-600',
                desc: 'Consistent 3+ orders, lower total spend',
              },
              {
                label: '🌱 Promising & First-Timers',
                count: metrics.rfmBreakdown?.promising || 0,
                color: 'bg-emerald-600',
                desc: 'Recent buyers (1-2 orders) in last 45 days',
              },
              {
                label: '⚠️ At-Risk / Churn Risk',
                count: metrics.rfmBreakdown?.atRisk || 0,
                color: 'bg-amber-500',
                desc: 'Multiple orders, inactive 45–89 days',
              },
              {
                label: '💤 Dormant & Inactive',
                count: metrics.rfmBreakdown?.dormant || 0,
                color: 'bg-slate-400',
                desc: 'Zero orders or last order ≥90 days ago',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{item.label}</span>
                  <span className="font-black text-slate-900">{item.count} Customers</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.min(100, Math.round((item.count / totalRfm) * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acquisition Channels */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Acquisition Channels & Revenue</h3>
              <p className="text-xs text-slate-400">Where your paying store customers originate</p>
            </div>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
              Omnichannel
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {(metrics.acquisitionChannels || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No channel data yet</p>
            ) : (
              (metrics.acquisitionChannels || []).map((chan, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{chan.channel}</span>
                    <span className="font-black text-slate-900">৳{(chan.revenue || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{chan.customersCount} Customers</span>
                    <span className="font-bold text-blue-600">{chan.percentage}% of Revenue</span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, chan.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Top VIP Customers Leaderboard ────────────────────────────────── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Top VIP Customers Leaderboard</h3>
              <p className="text-xs text-slate-400">Highest lifetime revenue contributors — real data</p>
            </div>
          </div>

          <Link
            href="/dashboard/crm/customers"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>View All Profiles</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(metrics.topSpenders || []).length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="font-bold">No customer spending data yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-2.5 px-4 rounded-l-xl">Rank</th>
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Phone Number</th>
                  <th className="py-2.5 px-4">Total Orders</th>
                  <th className="py-2.5 px-4">Lifetime Revenue</th>
                  <th className="py-2.5 px-4 rounded-r-xl">Last Purchase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {(metrics.topSpenders || []).map((top, idx) => (
                  <tr key={top.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-800">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-600'
                            : 'text-slate-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{top.name}</td>
                    <td className="py-3 px-4 text-slate-600">{top.phone}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{top.ordersCount} Orders</td>
                    <td className="py-3 px-4 font-black text-emerald-700">
                      ৳{(top.totalSpent || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{top.lastOrderAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
