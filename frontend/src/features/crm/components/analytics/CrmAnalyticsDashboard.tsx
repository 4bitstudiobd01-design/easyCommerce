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
  Flame,
  Award,
  ArrowUpRight,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface CrmAnalyticsDashboardProps {
  metrics: CrmAnalyticsMetrics;
}

export const CrmAnalyticsDashboard: React.FC<CrmAnalyticsDashboardProps> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      {/* Top 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers & Active */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Customers</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.activeCustomers}</span>
            <span className="text-xs text-slate-400 font-medium">/ {metrics.totalCustomers} total</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +12% this month
          </span>
        </div>

        {/* Average Customer LTV */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Customer LTV</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              ৳{metrics.avgCustomerLtv.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> High Lifetime Value
          </span>
        </div>

        {/* Repeat Purchase Rate */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Repeat Purchase Rate</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-700">{metrics.repeatPurchaseRate}%</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Industry Benchmark: &gt; 30%
          </span>
        </div>

        {/* Sales Pipeline Value */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Leads Pipeline Value</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              ৳{metrics.pipelineValue.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] font-bold text-indigo-600">
            {metrics.leadConversionRate}% Win Rate
          </span>
        </div>
      </div>

      {/* RFM Grid & Acquisition Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RFM Customer Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">RFM Customer Segmentation Grid</h3>
              <p className="text-xs text-slate-400">Recency, Frequency, and Monetary distribution</p>
            </div>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-bold">
              Automated RFM
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: '🌟 VIP Big Spenders', count: metrics.rfmBreakdown.vip, color: 'bg-purple-600', desc: 'Frequent buyers with highest total revenue' },
              { label: '🔁 Loyal Repeat Shoppers', count: metrics.rfmBreakdown.loyal, color: 'bg-blue-600', desc: 'Consistent 3+ completed orders' },
              { label: '🌱 Promising & First-Timers', count: metrics.rfmBreakdown.promising, color: 'bg-emerald-600', desc: 'Recent buyers with upside growth potential' },
              { label: '⚠️ At-Risk / Churn Risk', count: metrics.rfmBreakdown.atRisk, color: 'bg-amber-500', desc: 'High spenders who have not ordered in 45+ days' },
              { label: '💤 Dormant & Inactive', count: metrics.rfmBreakdown.dormant, color: 'bg-slate-400', desc: 'Zero activity in last 90 days' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{item.label}</span>
                  <span className="font-black text-slate-900">{item.count} Customers</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${Math.min(100, (item.count / metrics.totalCustomers) * 100 * 2.5)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Acquisition Channels */}
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
            {metrics.acquisitionChannels.map((chan, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{chan.channel}</span>
                  <span className="font-black text-slate-900">৳{chan.revenue.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{chan.customersCount} Customers</span>
                  <span className="font-bold text-blue-600">{chan.percentage}% of Revenue</span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                    style={{ width: `${chan.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top 5 High-Value Spenders Leaderboard */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Top VIP Customers Leaderboard</h3>
              <p className="text-xs text-slate-400">Highest lifetime revenue contributors</p>
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
              {metrics.topSpenders.map((top, idx) => (
                <tr key={top.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-black text-slate-800">
                    <span
                      className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 font-black'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-slate-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{top.name}</td>
                  <td className="py-3 px-4 text-slate-600">{top.phone}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{top.ordersCount} Orders</td>
                  <td className="py-3 px-4 font-black text-emerald-700">
                    ৳{top.totalSpent.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{top.lastOrderAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
