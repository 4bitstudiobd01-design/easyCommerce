'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { PartyPopper, Plus, RefreshCw, Edit2, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Holiday, useGetHolidaysQuery, useDeleteHolidayMutation } from '../api/hrmApi';
import { HolidayFormModal } from './HolidayFormModal';

function dayOfWeek(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long' });
}

export function HolidayManagementTable() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: holidays = [], isLoading, isFetching, refetch } = useGetHolidaysQuery({ year });
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();

  const [formState, setFormState] = useState<{ open: boolean; holiday: Holiday | null }>({
    open: false,
    holiday: null,
  });
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);

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
          <div className="flex items-center gap-1">
            <button onClick={() => setYear((y) => y - 1)} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-14 text-center font-bold text-slate-800 text-sm">{year}</span>
            <button onClick={() => setYear((y) => y + 1)} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
            Add Holiday
          </button>
        </div>
      </div>

      {/* Holidays Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Holiday</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Day</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={4} />
                  <TableRowSkeleton columns={4} />
                </>
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <PartyPopper className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No holidays added for {year}.</p>
                    <p className="text-xs text-slate-500 mt-1">Add national and company holidays so leave requests can account for them.</p>
                  </td>
                </tr>
              ) : (
                holidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                          <PartyPopper className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900">{holiday.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                      {new Date(holiday.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{dayOfWeek(holiday.date)}</td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => setFormState({ open: true, holiday })}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit holiday"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingHoliday(holiday)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                        title="Delete holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <HolidayFormModal
        isOpen={formState.open}
        holiday={formState.holiday}
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
