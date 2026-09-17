'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CalendarCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  Sun,
  Umbrella,
} from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import {
  AttendanceStatus,
  useGetAttendanceQuery,
  useGetDepartmentsQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useMarkAttendanceStatusMutation,
} from '../api/hrmApi';

const todayIso = () => new Date().toISOString().slice(0, 10);

const STATUS_META: Record<AttendanceStatus, { label: string; badge: string; icon: React.ElementType }> = {
  PRESENT: { label: 'PRESENT', badge: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  LATE: { label: 'LATE', badge: 'bg-amber-100 text-amber-800', icon: Clock },
  HALF_DAY: { label: 'HALF DAY', badge: 'bg-sky-100 text-sky-800', icon: Sun },
  ON_LEAVE: { label: 'ON LEAVE', badge: 'bg-violet-100 text-violet-800', icon: Umbrella },
  ABSENT: { label: 'ABSENT', badge: 'bg-rose-100 text-rose-800', icon: XCircle },
};

const MARK_OPTIONS: AttendanceStatus[] = ['PRESENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'ABSENT'];

function formatTime(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function AttendanceManagementTable() {
  const [date, setDate] = useState(todayIso());
  const [departmentId, setDepartmentId] = useState('');

  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: roster = [], isLoading, isFetching, refetch } = useGetAttendanceQuery({
    date,
    departmentId: departmentId || undefined,
  });
  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();
  const [markStatus] = useMarkAttendanceStatusMutation();

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus | 'UNMARKED', number> = {
      PRESENT: 0,
      LATE: 0,
      HALF_DAY: 0,
      ON_LEAVE: 0,
      ABSENT: 0,
      UNMARKED: 0,
    };
    roster.forEach((row) => {
      if (row.attendance) counts[row.attendance.status]++;
      else counts.UNMARKED++;
    });
    return counts;
  }, [roster]);

  const shiftDate = (days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    setDate(next.toISOString().slice(0, 10));
  };

  const handleCheckIn = async (employeeId: string) => {
    try {
      await checkIn({ employeeId, date }).unwrap();
      toast.success('Checked in.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to check in.');
    }
  };

  const handleCheckOut = async (employeeId: string) => {
    try {
      await checkOut({ employeeId, date }).unwrap();
      toast.success('Checked out.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to check out.');
    }
  };

  const handleMarkStatus = async (employeeId: string, status: AttendanceStatus) => {
    try {
      await markStatus({ employeeId, date, status }).unwrap();
      toast.success(`Marked as ${status.replace('_', ' ').toLowerCase()}.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update attendance.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Attendance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Track and correct daily employee attendance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(['PRESENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'ABSENT'] as AttendanceStatus[]).map((status) => {
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          return (
            <div key={status} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <Icon className="w-3.5 h-3.5" />
                {meta.label}
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{summary[status]}</div>
            </div>
          );
        })}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Not Marked</div>
          <div className="text-2xl font-extrabold text-slate-400 mt-1">{summary.UNMARKED}</div>
        </div>
      </div>

      {/* Date + Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayIso()}
            className="h-10 px-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-600"
          />
          <button
            onClick={() => shiftDate(1)}
            disabled={date >= todayIso()}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {date !== todayIso() && (
            <button
              onClick={() => setDate(todayIso())}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Jump to Today
            </button>
          )}
        </div>
        <div className="flex-1" />
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-600"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No active employees to track.</p>
                    <p className="text-xs text-slate-500 mt-1">Add employees first from the Employees page.</p>
                  </td>
                </tr>
              ) : (
                roster.map(({ employee, attendance }) => {
                  const meta = attendance ? STATUS_META[attendance.status] : null;
                  return (
                    <tr key={employee.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-900 text-white font-extrabold text-sm rounded-full flex items-center justify-center uppercase shrink-0 shadow-sm">
                            {employee.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{employee.fullName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{employee.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {employee.department?.name || <span className="text-slate-300">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4">
                        {meta ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${meta.badge}`}>
                            {meta.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            NOT MARKED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {formatTime(attendance?.checkInAt) || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {formatTime(attendance?.checkOutAt) || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {!attendance?.checkInAt && (
                            <button
                              onClick={() => handleCheckIn(employee.id)}
                              disabled={isCheckingIn}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold transition disabled:opacity-50"
                              title="Check In"
                            >
                              <LogIn className="w-3.5 h-3.5" /> In
                            </button>
                          )}
                          {attendance?.checkInAt && !attendance?.checkOutAt && (
                            <button
                              onClick={() => handleCheckOut(employee.id)}
                              disabled={isCheckingOut}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold transition disabled:opacity-50"
                              title="Check Out"
                            >
                              <LogOut className="w-3.5 h-3.5" /> Out
                            </button>
                          )}
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) handleMarkStatus(employee.id, e.target.value as AttendanceStatus);
                            }}
                            className="text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg h-7 px-1.5 bg-white focus:outline-none focus:border-blue-600"
                            title="Mark as..."
                          >
                            <option value="">Mark as...</option>
                            {MARK_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_META[status].label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
