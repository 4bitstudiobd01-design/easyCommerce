'use client';

import React, { useState } from 'react';
import { Target, AlertTriangle, TrendingUp, TrendingDown, Building2, Plus, Calendar } from 'lucide-react';

// Budget is a UI scaffold ready for backend integration.
// When the backend budget module is built, replace this mock data with RTK Query hooks.

interface BudgetItem {
  id: string;
  department: string;
  category: string;
  period: string;
  allocated: number;
  used: number;
  remaining: number;
  utilization: number;
  status: 'ON_TRACK' | 'WARNING' | 'OVERSPENT';
}

const MOCK_BUDGETS: BudgetItem[] = [
  { id: '1', department: 'Operations', category: 'General', period: 'Sep 2026', allocated: 500000, used: 325000, remaining: 175000, utilization: 65, status: 'ON_TRACK' },
  { id: '2', department: 'Marketing', category: 'Advertising', period: 'Sep 2026', allocated: 300000, used: 267000, remaining: 33000, utilization: 89, status: 'WARNING' },
  { id: '3', department: 'HR', category: 'Recruitment', period: 'Sep 2026', allocated: 150000, used: 162000, remaining: -12000, utilization: 108, status: 'OVERSPENT' },
  { id: '4', department: 'Technology', category: 'Software', period: 'Sep 2026', allocated: 200000, used: 95000, remaining: 105000, utilization: 47, status: 'ON_TRACK' },
  { id: '5', department: 'Sales', category: 'Travel', period: 'Sep 2026', allocated: 120000, used: 98000, remaining: 22000, utilization: 82, status: 'WARNING' },
];

function formatMoney(amount: number) {
  return `৳${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinanceBudgetView() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterDept, setFilterDept] = useState('ALL');
  const [viewPeriod, setViewPeriod] = useState('this_month');

  const departments = ['ALL', ...Array.from(new Set(MOCK_BUDGETS.map((b) => b.department)))];
  const filtered = filterDept === 'ALL' ? MOCK_BUDGETS : MOCK_BUDGETS.filter((b) => b.department === filterDept);

  const totalAllocated = MOCK_BUDGETS.reduce((s, b) => s + b.allocated, 0);
  const totalUsed = MOCK_BUDGETS.reduce((s, b) => s + b.used, 0);
  const totalRemaining = totalAllocated - totalUsed;
  const overallUtil = Math.round((totalUsed / totalAllocated) * 100);

  const overspent = MOCK_BUDGETS.filter((b) => b.status === 'OVERSPENT');
  const warnings = MOCK_BUDGETS.filter((b) => b.status === 'WARNING');

  const statusConfig = {
    ON_TRACK: { label: 'On Track', color: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
    WARNING: { label: 'Warning', color: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
    OVERSPENT: { label: 'Overspent', color: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Budget Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Control departmental budgets and spending limits</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Demo Data — Backend Integration Pending
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            New Budget
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(overspent.length > 0 || warnings.length > 0) && (
        <div className="space-y-2">
          {overspent.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <p className="text-xs font-semibold text-rose-700">
                <span className="font-extrabold">{b.department}</span> — {b.category} budget is overspent by {formatMoney(Math.abs(b.remaining))} ({b.utilization}% used)
              </p>
            </div>
          ))}
          {warnings.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs font-semibold text-amber-700">
                <span className="font-extrabold">{b.department}</span> — {b.category} is at {b.utilization}% of budget. Only {formatMoney(b.remaining)} remaining.
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-2">Total Allocated</p>
          <p className="text-xl font-extrabold text-slate-900">{formatMoney(totalAllocated)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{MOCK_BUDGETS.length} departments</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-2">Total Used</p>
          <p className="text-xl font-extrabold text-slate-900">{formatMoney(totalUsed)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{overallUtil}% utilization</p>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-2">Remaining</p>
          <p className="text-xl font-extrabold text-emerald-600">{formatMoney(totalRemaining)}</p>
          <p className="text-[11px] text-emerald-400 mt-1">Available budget</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-2">Overall Utilization</p>
          <p className="text-xl font-extrabold text-slate-900">{overallUtil}%</p>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${overallUtil >= 100 ? 'bg-rose-500' : overallUtil >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(overallUtil, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {departments.map((d) => (
            <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>
          ))}
        </select>
        <select
          value={viewPeriod}
          onChange={(e) => setViewPeriod(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_quarter">This Quarter</option>
          <option value="this_year">This Year</option>
        </select>
      </div>

      {/* Budget Cards */}
      <div className="space-y-3">
        {filtered.map((budget) => {
          const cfg = statusConfig[budget.status];
          return (
            <div key={budget.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{budget.department}</p>
                    <p className="text-xs text-slate-500">{budget.category} · {budget.period}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <button className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 rounded-lg hover:bg-slate-50">
                    Edit
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">Budget Used</span>
                  <span className={`text-xs font-extrabold ${budget.utilization >= 100 ? 'text-rose-600' : budget.utilization >= 80 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {budget.utilization}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${cfg.bar}`}
                    style={{ width: `${Math.min(budget.utilization, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Allocated</p>
                  <p className="text-sm font-extrabold text-slate-800">{formatMoney(budget.allocated)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Used</p>
                  <p className="text-sm font-extrabold text-slate-800">{formatMoney(budget.used)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Remaining</p>
                  <p className={`text-sm font-extrabold ${budget.remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {budget.remaining < 0 ? '-' : ''}{formatMoney(budget.remaining)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create Budget</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <input type="text" placeholder="e.g. Operations" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <input type="text" placeholder="e.g. General Expenses" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Allocated Amount</label>
                <input type="number" placeholder="500000" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Period</label>
                <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Yearly</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => { alert('Budget API not yet implemented. This is a UI scaffold.'); setShowCreateModal(false); }}
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700"
              >
                Create Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
