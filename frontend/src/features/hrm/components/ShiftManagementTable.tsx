'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Clock3, Plus, RefreshCw, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Shift, useGetShiftsQuery, useDeleteShiftMutation } from '../api/hrmApi';
import { ShiftFormModal } from './ShiftFormModal';

function formatTime(value: string) {
  const [h, m] = value.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function ShiftManagementTable() {
  const { data: shifts = [], isLoading, isFetching, refetch } = useGetShiftsQuery();
  const [deleteShift, { isLoading: isDeleting }] = useDeleteShiftMutation();

  const [formState, setFormState] = useState<{ open: boolean; shift: Shift | null }>({ open: false, shift: null });
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deletingShift) return;
    try {
      await deleteShift(deletingShift.id).unwrap();
      toast.success('Shift deleted.');
      setDeletingShift(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete shift.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Clock3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Shifts
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-full border border-blue-200">
                {shifts.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Define shift timings used on the roster</p>
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
            onClick={() => setFormState({ open: true, shift: null })}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            New Shift
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Shift</th>
                <th className="px-6 py-4">Timing</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={4} />
                  <TableRowSkeleton columns={4} />
                </>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Clock3 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No shifts defined yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Create a shift before building the roster.</p>
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: shift.colorTag }} />
                        <span className="font-bold text-slate-900">{shift.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                      {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          shift.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {shift.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => setFormState({ open: true, shift })}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit shift"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingShift(shift)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                        title="Delete shift"
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

      <ShiftFormModal isOpen={formState.open} shift={formState.shift} onClose={() => setFormState({ open: false, shift: null })} />

      <Modal
        isOpen={!!deletingShift}
        onClose={() => setDeletingShift(null)}
        title="Delete Shift?"
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeletingShift(null)}
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
          Are you sure you want to delete <strong>{deletingShift?.name}</strong>? Shifts still assigned on the roster cannot be
          deleted.
        </div>
      </Modal>
    </div>
  );
}
