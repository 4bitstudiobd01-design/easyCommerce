'use client';

import React from 'react';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Users,
  UserPlus,
  Clock,
  Wallet,
  CalendarClock,
  Briefcase,
  Video,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useGetHrOverviewReportQuery, useReviewLeaveRequestMutation } from '../api/hrmApi';

// Validated categorical palette (dataviz skill reference palette — fixed order, never cycled by value)
const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
// Reserved status colors — used only for genuine state (present/late/absent), never as generic series identity
const STATUS = { good: '#0ca30c', warning: '#fab219', critical: '#d03b3b' };
// Ordinal ramp (single hue, ascending) for the recruitment funnel's ordered stages
const ORDINAL_BLUE = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STAGE_LABELS: Record<string, string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
};

function formatAmount(amount: string) {
  return `৳${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function KpiTile({ icon: Icon, label, value, accent, sub }: { icon: any; label: string; value: React.ReactNode; accent: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} /> {label}
      </div>
      <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export function HrDashboardView() {
  const { data, isLoading } = useGetHrOverviewReportQuery();
  const [reviewLeaveRequest, { isLoading: isReviewing }] = useReviewLeaveRequestMutation();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewLeaveRequest({ id, status }).unwrap();
      toast.success(status === 'APPROVED' ? 'Leave request approved.' : 'Leave request declined.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to review leave request.');
    }
  };

  const employmentTypeData = Object.entries(data.headcount.byEmploymentType).map(([type, count], i) => ({
    type: type.replace('_', ' '),
    count,
    color: CATEGORICAL[i % CATEGORICAL.length],
  }));

  const leaveTypeData = Object.entries(data.leave.approvedDaysThisYearByType).map(([type, days], i) => ({
    type: type.charAt(0) + type.slice(1).toLowerCase(),
    days,
    color: CATEGORICAL[i % CATEGORICAL.length],
  }));

  const departmentData = data.headcount.byDepartment.map((d, i) => ({
    name: d.departmentName,
    value: d.count,
    color: CATEGORICAL[i % CATEGORICAL.length],
  }));

  const attendanceTrendData = data.attendanceTrend7Days.map((day) => ({
    date: new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }),
    Present: day.present,
    Late: day.late,
    Absent: day.absent,
  }));

  const stageOrder: Array<{ key: string; color: string }> = [
    { key: 'APPLIED', color: ORDINAL_BLUE[0] },
    { key: 'SCREENING', color: ORDINAL_BLUE[1] },
    { key: 'INTERVIEW', color: ORDINAL_BLUE[2] },
    { key: 'OFFER', color: ORDINAL_BLUE[3] },
    { key: 'HIRED', color: ORDINAL_BLUE[4] },
    { key: 'REJECTED', color: STATUS.critical },
  ];
  const funnelData = stageOrder.map(({ key, color }) => ({
    stage: STAGE_LABELS[key],
    count: (data.recruitment.byStage as any)[key] ?? 0,
    color,
  }));

  const payrollTrendData = data.payroll.trend.map((run) => ({
    label: `${MONTHS[run.month - 1].slice(0, 3)} ${run.year}`,
    Gross: Number(run.grossAmount),
    Net: Number(run.netAmount),
    Deductions: Number(run.deductions),
  }));

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile icon={Users} label="Total Employees" value={data.headcount.total} accent={CATEGORICAL[0]} sub="Active headcount" />
        <KpiTile
          icon={UserPlus}
          label="New Joiners"
          value={data.newJoinersLast30Days}
          accent={STATUS.good}
          sub="Last 30 days"
        />
        <KpiTile
          icon={Clock}
          label="Late Arrivals Today"
          value={data.lateArrivalsToday.length}
          accent={STATUS.warning}
          sub={`${data.attendanceToday.PRESENT} present today`}
        />
        <KpiTile
          icon={Wallet}
          label="Total Payroll"
          value={data.payroll.latestRun ? formatAmount(data.payroll.latestRun.totalNetAmount) : '—'}
          accent={CATEGORICAL[2]}
          sub={data.payroll.latestRun ? `${MONTHS[data.payroll.latestRun.month - 1]} ${data.payroll.latestRun.year}` : 'No runs yet'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Employee Status & Type */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Employees by Employment Type</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={employmentTypeData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {employmentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Type Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Leave Type Distribution (Approved Days, This Year)</h3>
          {leaveTypeData.every((d) => d.days === 0) ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No approved leave yet</div>
          ) : (
            <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-6">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leaveTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="days" stroke="none">
                      {leaveTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-[200px]">
                {leaveTypeData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] font-medium text-slate-700 truncate">{item.type}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 shrink-0">{item.days}d</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Trend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Attendance Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={attendanceTrendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="Present" stroke={STATUS.good} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Late" stroke={STATUS.warning} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Absent" stroke={STATUS.critical} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Headcount by Department</h3>
          {departmentData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No active employees yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={departmentData} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Late Arrivals Today */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: STATUS.warning }} /> Late Arrivals Today
          </h3>
          {data.lateArrivalsToday.length === 0 ? (
            <p className="text-xs text-slate-400">No late arrivals today.</p>
          ) : (
            <div className="space-y-3">
              {data.lateArrivalsToday.map((e) => (
                <div key={e.employeeId} className="flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{e.fullName}</div>
                    <div className="text-slate-400">{e.departmentName || 'Unassigned'}</div>
                  </div>
                  <span className="font-mono text-slate-500">
                    {e.checkInAt ? new Date(e.checkInAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Video className="w-4 h-4" style={{ color: CATEGORICAL[0] }} /> Upcoming Interviews
          </h3>
          {data.upcomingInterviews.length === 0 ? (
            <p className="text-xs text-slate-400">No interviews scheduled.</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingInterviews.map((i, idx) => (
                <div key={idx} className="text-xs">
                  <div className="font-bold text-slate-800">{i.candidateName}</div>
                  <div className="text-slate-500">{i.jobTitle}</div>
                  <div className="text-slate-400 mt-0.5">{new Date(i.scheduledAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approvals */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CalendarClock className="w-4 h-4" style={{ color: CATEGORICAL[1] }} /> Pending Leave Approvals
          </h3>
          {data.pendingLeaveRequests.length === 0 ? (
            <p className="text-xs text-slate-400">No pending leave requests.</p>
          ) : (
            <div className="space-y-3">
              {data.pendingLeaveRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{r.employeeName}</div>
                    <div className="text-slate-400">
                      {r.leaveType.charAt(0) + r.leaveType.slice(1).toLowerCase()} · {r.totalDays}d
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleReview(r.id, 'APPROVED')}
                      disabled={isReviewing}
                      className="p-1.5 rounded-lg hover:bg-emerald-50 transition disabled:opacity-50"
                      title="Approve"
                    >
                      <CheckCircle2 className="w-4 h-4" style={{ color: STATUS.good }} />
                    </button>
                    <button
                      onClick={() => handleReview(r.id, 'REJECTED')}
                      disabled={isReviewing}
                      className="p-1.5 rounded-lg hover:bg-rose-50 transition disabled:opacity-50"
                      title="Decline"
                    >
                      <XCircle className="w-4 h-4" style={{ color: STATUS.critical }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recruitment Statistics */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4" style={{ color: CATEGORICAL[0] }} /> Recruitment Funnel
          </h3>
          <div className="flex items-center gap-6 mb-4 text-xs">
            <div>
              <div className="text-slate-400">Applicants</div>
              <div className="text-lg font-extrabold text-slate-900">{data.recruitment.totalApplicants}</div>
            </div>
            <div>
              <div className="text-slate-400">Hired</div>
              <div className="text-lg font-extrabold" style={{ color: STATUS.good }}>{data.recruitment.hired}</div>
            </div>
            <div>
              <div className="text-slate-400">Avg. Days to Hire</div>
              <div className="text-lg font-extrabold text-slate-900">{data.recruitment.avgDaysToHire ?? '—'}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payroll Trend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Payroll Trend</h3>
          {payrollTrendData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No payroll runs yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={payrollTrendData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} formatter={(value) => formatAmount(String(value))} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Gross" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net" fill={CATEGORICAL[2]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Deductions" fill={CATEGORICAL[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
