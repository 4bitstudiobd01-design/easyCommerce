'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { CalendarClock } from 'lucide-react';
import { Candidate, useGetCandidatesQuery, useScheduleInterviewMutation } from '../api/hrmApi';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  defaultCandidateId?: string;
  onClose: () => void;
}

const fieldClass =
  'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white';
const labelClass = 'block text-xs font-bold text-slate-700 mb-1.5';

const emptyForm = {
  candidateId: '',
  scheduledDate: '',
  scheduledTime: '',
  durationMinutes: '30',
  interviewerNames: '',
  meetingLink: '',
};

export function ScheduleInterviewModal({ isOpen, defaultCandidateId, onClose }: ScheduleInterviewModalProps) {
  const [form, setForm] = useState(emptyForm);
  const { data: candidates = [] } = useGetCandidatesQuery();
  const [scheduleInterview, { isLoading: isSaving }] = useScheduleInterviewMutation();

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...emptyForm, candidateId: defaultCandidateId ?? '' });
  }, [isOpen, defaultCandidateId]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidateId) return toast.error('Select a candidate.');
    if (!form.scheduledDate || !form.scheduledTime) return toast.error('Pick a date and time.');

    try {
      await scheduleInterview({
        candidateId: form.candidateId,
        scheduledAt: new Date(`${form.scheduledDate}T${form.scheduledTime}`).toISOString(),
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        interviewerNames: form.interviewerNames || undefined,
        meetingLink: form.meetingLink || undefined,
      }).unwrap();
      toast.success('Interview scheduled.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to schedule interview.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Interview"
      subtitle="Book an interview slot for a candidate"
      icon={<CalendarClock className="w-5 h-5" />}
      size="lg"
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
            form="schedule-interview-form"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Scheduling...' : 'Schedule Interview'}
          </button>
        </>
      }
    >
      <form id="schedule-interview-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Candidate *</label>
          <select className={fieldClass} value={form.candidateId} onChange={(e) => set('candidateId', e.target.value)}>
            <option value="">Select a candidate</option>
            {candidates.map((c: Candidate) => (
              <option key={c.id} value={c.id}>
                {c.fullName} {c.jobPosting ? `· ${c.jobPosting.title}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Date *</label>
          <input type="date" className={fieldClass} value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Time *</label>
          <input type="time" className={fieldClass} value={form.scheduledTime} onChange={(e) => set('scheduledTime', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Duration (minutes)</label>
          <input
            type="number"
            min={5}
            max={480}
            className={fieldClass}
            value={form.durationMinutes}
            onChange={(e) => set('durationMinutes', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Interviewer(s)</label>
          <input
            className={fieldClass}
            value={form.interviewerNames}
            onChange={(e) => set('interviewerNames', e.target.value)}
            placeholder="Rahim Uddin, Nusrat Jahan"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Meeting Link</label>
          <input
            className={fieldClass}
            value={form.meetingLink}
            onChange={(e) => set('meetingLink', e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
          />
        </div>
      </form>
    </Modal>
  );
}
