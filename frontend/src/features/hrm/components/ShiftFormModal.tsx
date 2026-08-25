'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Clock3 } from 'lucide-react';
import { Shift, useCreateShiftMutation, useUpdateShiftMutation } from '../api/hrmApi';

interface ShiftFormModalProps {
  isOpen: boolean;
  shift: Shift | null;
  onClose: () => void;
}

const COLOR_PRESETS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

export function ShiftFormModal({ isOpen, shift, onClose }: ShiftFormModalProps) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [colorTag, setColorTag] = useState(COLOR_PRESETS[0]);

  const [createShift, { isLoading: isCreating }] = useCreateShiftMutation();
  const [updateShift, { isLoading: isUpdating }] = useUpdateShiftMutation();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (isOpen) {
      setName(shift?.name ?? '');
      setStartTime(shift?.startTime?.slice(0, 5) ?? '09:00');
      setEndTime(shift?.endTime?.slice(0, 5) ?? '17:00');
      setColorTag(shift?.colorTag ?? COLOR_PRESETS[0]);
    }
  }, [isOpen, shift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startTime || !endTime) {
      toast.error('Name, start time, and end time are all required.');
      return;
    }

    try {
      if (shift) {
        await updateShift({ id: shift.id, name, startTime, endTime, colorTag }).unwrap();
        toast.success('Shift updated.');
      } else {
        await createShift({ name, startTime, endTime, colorTag }).unwrap();
        toast.success('Shift created.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save shift.');
    }
  };

  const fieldClass =
    'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={shift ? 'Edit Shift' : 'New Shift'}
      icon={<Clock3 className="w-5 h-5" />}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="shift-form"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : shift ? 'Save Changes' : 'Create Shift'}
          </button>
        </>
      }
    >
      <form id="shift-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Shift Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Shift"
            className={`${fieldClass} placeholder-slate-400`}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Start Time</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">End Time</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={fieldClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Color Tag</label>
          <div className="flex items-center gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setColorTag(color)}
                className={`w-8 h-8 rounded-full transition ring-offset-2 ${colorTag === color ? 'ring-2 ring-slate-900' : ''}`}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
