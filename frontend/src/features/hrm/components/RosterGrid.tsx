'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarRange, ChevronLeft, ChevronRight, RefreshCw, Settings2 } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import {
  useGetRosterQuery,
  useGetDepartmentsQuery,
  useAssignShiftMutation,
  useRemoveShiftAssignmentMutation,
} from '../api/hrmApi';

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function RosterGrid() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [departmentId, setDepartmentId] = useState('');

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const startDate = toIso(days[0]);
  const endDate = toIso(days[6]);

  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: roster, isLoading, isFetching, refetch } = useGetRosterQuery({
    startDate,
    endDate,
    departmentId: departmentId || undefined,
  });
  const [assignShift] = useAssignShiftMutation();
  const [removeAssignment] = useRemoveShiftAssignmentMutation();

  const assignmentMap = useMemo(() => {
    const map = new Map<string, string>();
    roster?.assignments.forEach((a) => map.set(`${a.employeeId}_${a.date}`, a.shiftId));
    return map;
  }, [roster]);

  const shiftById = useMemo(() => {
    const map = new Map<string, { name: string; colorTag: string }>();
    roster?.shifts.forEach((s) => map.set(s.id, { name: s.name, colorTag: s.colorTag }));
    return map;
  }, [roster]);

  const handleCellChange = async (employeeId: string, date: string, shiftId: string) => {
    try {
      if (shiftId) {
        await assignShift({ employeeId, date, shiftId }).unwrap();
      } else {
        await removeAssignment({ employeeId, date }).unwrap();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update the roster.');
    }
  };

  const employees = roster?.employees ?? [];
  const shifts = roster?.shifts ?? [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
            <CalendarRange className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Roster</h2>
            <p className="text-xs text-slate-500 mt-0.5">Assign weekly shifts per employee</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Legend */}
      {shifts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" /> Shifts
          </span>
          {shifts.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.colorTag }} />
              {s.name}
            </span>
          ))}
        </div>
      )}

      {/* Week + Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-800 px-2 whitespace-nowrap">
            {days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
            {days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(mondayOf(new Date()))}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            This Week
          </button>
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

      {/* Roster Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[840px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 sticky left-0 bg-slate-50/80">Employee</th>
                {days.map((d) => (
                  <th key={toIso(d)} className="px-3 py-4 text-center min-w-[110px]">
                    <div>{d.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                    <div className="text-slate-400 font-mono normal-case">{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={8} />
                  <TableRowSkeleton columns={8} />
                  <TableRowSkeleton columns={8} />
                </>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <CalendarRange className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No active employees to schedule.</p>
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Settings2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No shifts defined yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Create shifts first, then assign them here.</p>
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50/40 transition">
                    <td className="px-6 py-3 sticky left-0 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 text-white font-extrabold text-xs rounded-full flex items-center justify-center uppercase shrink-0">
                          {employee.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight text-xs">{employee.fullName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{employee.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    {days.map((d) => {
                      const dateIso = toIso(d);
                      const shiftId = assignmentMap.get(`${employee.id}_${dateIso}`) ?? '';
                      const shiftMeta = shiftId ? shiftById.get(shiftId) : null;
                      return (
                        <td key={dateIso} className="px-2 py-2 text-center">
                          <select
                            value={shiftId}
                            onChange={(e) => handleCellChange(employee.id, dateIso, e.target.value)}
                            className="w-full text-[11px] font-bold rounded-lg h-9 px-1 border focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer transition"
                            style={
                              shiftMeta
                                ? { backgroundColor: `${shiftMeta.colorTag}1A`, borderColor: shiftMeta.colorTag, color: shiftMeta.colorTag }
                                : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#94A3B8' }
                            }
                          >
                            <option value="">— Off —</option>
                            {shifts.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
