'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, CalendarClock, Receipt, Wallet, BarChart3 } from 'lucide-react';
import { useGetHrOverviewReportQuery } from '../api/hrmApi';

const DEPARTMENT_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#94a3b8'];

const ATTENDANCE_META: Record<string, { label: string; color: string }> = {
  PRESENT: { label: 'Present', color: '#10b981' },
  LATE: { label: 'Late', color: '#f59e0b' },
  HALF_DAY: { label: 'Half Day', color: '#0ea5e9' },
  ON_LEAVE: { label: 'On Leave', color: '#8b5cf6' },
  ABSENT: { label: 'Absent', color: '#ef4444' },
  NOT_MARKED: { label: 'Not Marked', color: '#cbd5e1' },
};

function formatAmount(amount: string) {
  return `BDT ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function HrReportsView() {
  const { data, isLoading } = useGetHrOverviewReportQuery();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  const departmentChartData = data.headcount.byDepartment.map((d, i) => ({
    name: d.departmentName,
    value: d.count,
    color: DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length],
  }));

  const attendanceChartData = Object.entries(data.attendanceToday).map(([status, count]) => ({
    status,
    label: ATTENDANCE_META[status]?.label ?? status,
    count,
    color: ATTENDANCE_META[status]?.color ?? '#94a3b8',
  }));

  const leaveChartData = Object.entries(data.leave.approvedDaysThisYearByType).map(([type, days]) => ({
    type: type.charAt(0) + type.slice(1).toLowerCase(),
    days,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">HR Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">A snapshot of headcount, attendance, leave, payroll, and expenses</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" /> Active Headcount
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{data.headcount.total}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <CalendarClock className="w-3.5 h-3.5" /> Pending Leave
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{data.leave.pendingRequests}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <Receipt className="w-3.5 h-3.5" /> Pending Expenses
          </div>
          <div className="text-lg font-extrabold text-rose-600 mt-1 font-mono">{formatAmount(data.expenses.pendingAmount)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{data.expenses.pendingCount} claim(s)</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <Wallet className="w-3.5 h-3.5" /> Latest Payroll (Net)
          </div>
          {data.payroll.latestRun ? (
            <>
              <div className="text-lg font-extrabold text-emerald-700 mt-1 font-mono">{formatAmount(data.payroll.latestRun.totalNetAmount)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {MONTHS[data.payroll.latestRun.month - 1]} {data.payroll.latestRun.year} · {data.payroll.latestRun.status}
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-300 mt-1">No runs yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Headcount by Department */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col min-h-[320px]">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Headcount by Department</h3>
          {departmentChartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No active employees yet</div>
          ) : (
            <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-6">
              <div className="relative w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={departmentChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {departmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-extrabold text-slate-900">{data.headcount.total}</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">Employees</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-[200px]">
                {departmentChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] font-medium text-slate-700 truncate">{item.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Today's Attendance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col min-h-[320px]">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Today's Attendance</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={attendanceChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {attendanceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leave Days by Type */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Approved Leave Days This Year, by Type</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={leaveChartData} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }} axisLine={false} tickLine={false} width={70} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
            <Bar dataKey="days" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
