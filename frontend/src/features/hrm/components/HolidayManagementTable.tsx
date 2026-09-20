'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PartyPopper, Sparkles, Gift, Star, Plus, RefreshCw, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Holiday, useGetHolidaysQuery, useDeleteHolidayMutation } from '../api/hrmApi';
import { HolidayFormModal } from './HolidayFormModal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FESTIVE_STYLES = [
  { chip: 'from-rose-100 to-orange-100 border-rose-300 text-rose-800', dot: 'bg-rose-500', icon: PartyPopper },
  { chip: 'from-violet-100 to-fuchsia-100 border-violet-300 text-violet-800', dot: 'bg-violet-500', icon: Sparkles },
  { chip: 'from-emerald-100 to-teal-100 border-emerald-300 text-emerald-800', dot: 'bg-emerald-500', icon: Gift },
  { chip: 'from-amber-100 to-yellow-100 border-amber-300 text-amber-800', dot: 'bg-amber-500', icon: Star },
  { chip: 'from-sky-100 to-cyan-100 border-sky-300 text-sky-800', dot: 'bg-sky-500', icon: PartyPopper },
  { chip: 'from-pink-100 to-rose-100 border-pink-300 text-pink-800', dot: 'bg-pink-500', icon: Sparkles },
];

function festiveStyleFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return FESTIVE_STYLES[hash % FESTIVE_STYLES.length];
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function isSameDate(a: Date, y: number, m: number, d: number) {
  return a.getFullYear() === y && a.getMonth() === m && a.getDate() === d;
}

export function HolidayManagementTable() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const { data: holidays = [], isLoading, isFetching, refetch } = useGetHolidaysQuery({ year });
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();

  const [formState, setFormState] = useState<{ open: boolean; holiday: Holiday | null; initialDate?: string }>({
    open: false,
    holiday: null,
  });
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, Holiday[]>();
    for (const holiday of holidays) {
      const key = holiday.date.slice(0, 10);
      const existing = map.get(key);
      if (existing) existing.push(holiday);
      else map.set(key, [holiday]);
    }
    return map;
  }, [holidays]);

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, i) => {
      const dayNumber = i - firstWeekday + 1;
      if (dayNumber < 1) {
        return { inMonth: false, day: daysInPrevMonth + dayNumber, key: `prev-${i}` };
      }
      if (dayNumber > daysInMonth) {
        return { inMonth: false, day: dayNumber - daysInMonth, key: `next-${i}` };
      }
      const dateKey = isoDate(year, month, dayNumber);
      return {
        inMonth: true,
        day: dayNumber,
        key: dateKey,
        dateKey,
        isToday: isSameDate(today, year, month, dayNumber),
        holidays: holidaysByDate.get(dateKey) ?? [],
      };
    });
  }, [year, month, today, holidaysByDate]);

  const goToMonth = (delta: number) => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  const goToToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const handleDeleteConfirm = async () => {
    if (!deletingHoliday) return;
    try {
      await deleteHoliday(deletingHoliday.id).unwrap();
      toast.success('Holiday deleted.');
      setDeletingHoliday(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete holiday.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-rose-500 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            <PartyPopper className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Holidays
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-full border border-blue-200">
                {holidays.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Company holiday calendar</p>
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
          <button
            onClick={() => setFormState({ open: true, holiday: null })}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Add New Holiday
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <button
            onClick={goToToday}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Today
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => goToMonth(-1)} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-base font-extrabold text-slate-900 min-w-[9rem] text-center">
              {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => goToMonth(1)} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="w-[74px]" />
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="px-3 py-3 text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              {wd}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <PartyPopper className="w-10 h-10 mx-auto mb-2 text-slate-300 animate-pulse" />
            Loading calendar...
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((cell) => (
              <div
                key={cell.key}
                onClick={() => {
                  if (!cell.inMonth) return;
                  if (cell.holidays && cell.holidays.length > 0) {
                    setFormState({ open: true, holiday: cell.holidays[0] });
                  } else {
                    setFormState({ open: true, holiday: null, initialDate: cell.dateKey });
                  }
                }}
                className={`group/cell min-h-[110px] border-b border-r border-slate-100 p-2 align-top transition ${
                  cell.inMonth ? 'cursor-pointer hover:bg-slate-50/70' : 'bg-slate-50/40'
                } ${cell.isToday ? 'bg-amber-50/70' : ''} ${
                  cell.inMonth && cell.holidays && cell.holidays.length > 0 ? 'bg-gradient-to-br from-white via-white to-slate-50/60' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {cell.inMonth && cell.holidays && cell.holidays.length > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${festiveStyleFor(cell.holidays[0].name).dot}`} />
                  )}
                  <div
                    className={`text-xs font-bold ${
                      !cell.inMonth ? 'text-slate-300' : cell.isToday ? 'text-amber-700' : 'text-slate-700'
                    }`}
                  >
                    {cell.day}
                  </div>
                  {cell.isToday && cell.inMonth && (
                    <span className="text-[9px] font-extrabold uppercase tracking-wide text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </div>
                {cell.inMonth && cell.holidays && cell.holidays.length > 0 && (
                  <div className="mt-1.5 space-y-1.5">
                    {cell.holidays.map((holiday) => {
                      const style = festiveStyleFor(holiday.name);
                      const Icon = style.icon;
                      return (
                        <div
                          key={holiday.id}
                          className={`group/chip relative flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-gradient-to-r ${style.chip} border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-extrabold truncate">{holiday.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingHoliday(holiday);
                            }}
                            className="ml-auto opacity-0 group-hover/chip:opacity-100 transition text-rose-500 hover:text-rose-700 shrink-0"
                            title="Delete holiday"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <HolidayFormModal
        isOpen={formState.open}
        holiday={formState.holiday}
        initialDate={formState.initialDate}
        onClose={() => setFormState({ open: false, holiday: null })}
      />

      <Modal
        isOpen={!!deletingHoliday}
        onClose={() => setDeletingHoliday(null)}
        title="Delete Holiday?"
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeletingHoliday(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </>
        }
      >
        <div className="p-6 text-sm text-slate-600">
          Are you sure you want to delete <strong>{deletingHoliday?.name}</strong>?
        </div>
      </Modal>
    </div>
  );
}
