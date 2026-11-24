'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { PartyPopper } from 'lucide-react';
import { Holiday, useCreateHolidayMutation, useUpdateHolidayMutation } from '../api/hrmApi';

interface HolidayFormModalProps {
  isOpen: boolean;
  holiday: Holiday | null;
  initialDate?: string;
  onClose: () => void;
}

export function HolidayFormModal({ isOpen, holiday, initialDate, onClose }: HolidayFormModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const [createHoliday, { isLoading: isCreating }] = useCreateHolidayMutation();
  const [updateHoliday, { isLoading: isUpdating }] = useUpdateHolidayMutation();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (isOpen) {
      setName(holiday?.name ?? '');
      setDate(holiday?.date?.slice(0, 10) ?? initialDate ?? '');
    }
  }, [isOpen, holiday, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      toast.error('Name and date are both required.');
      return;
    }

    try {
      if (holiday) {
        await updateHoliday({ id: holiday.id, name, date }).unwrap();
        toast.success('Holiday updated.');
      } else {
        await createHoliday({ name, date }).unwrap();
        toast.success('Holiday added.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save holiday.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={holiday ? 'Edit Holiday' : 'Add Holiday'}
      icon={<PartyPopper className="w-5 h-5" />}
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
            form="holiday-form"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : holiday ? 'Save Changes' : 'Add Holiday'}
          </button>
        </>
      }
    >
      <form id="holiday-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Holiday Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Independence Day"
            className="w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </form>
    </Modal>
  );
}
