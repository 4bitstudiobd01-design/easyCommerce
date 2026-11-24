'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { UserPlus } from 'lucide-react';
import { JobPosting, useGetJobPostingsQuery, useCreateCandidateMutation } from '../api/hrmApi';

interface CandidateFormModalProps {
  isOpen: boolean;
  defaultJobPostingId?: string;
  onClose: () => void;
}

const fieldClass =
  'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white';
const labelClass = 'block text-xs font-bold text-slate-700 mb-1.5';

const emptyForm = {
  jobPostingId: '',
  fullName: '',
  email: '',
  phone: '',
  source: '',
  notes: '',
};

export function CandidateFormModal({ isOpen, defaultJobPostingId, onClose }: CandidateFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const { data: jobPostings = [] } = useGetJobPostingsQuery();
  const [createCandidate, { isLoading: isSaving }] = useCreateCandidateMutation();

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...emptyForm, jobPostingId: defaultJobPostingId ?? '' });
  }, [isOpen, defaultJobPostingId]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jobPostingId) return toast.error('Select a job posting.');
    if (!form.fullName.trim()) return toast.error('Full name is required.');

    try {
      await createCandidate({
        jobPostingId: form.jobPostingId,
        fullName: form.fullName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        source: form.source || undefined,
        notes: form.notes || undefined,
      }).unwrap();
      toast.success('Candidate added.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to add candidate.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Candidate"
      subtitle="Add a new applicant to a job posting's pipeline"
      icon={<UserPlus className="w-5 h-5" />}
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
            form="candidate-form"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Add Candidate'}
          </button>
        </>
      }
    >
      <form id="candidate-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Job Posting *</label>
          <select className={fieldClass} value={form.jobPostingId} onChange={(e) => set('jobPostingId', e.target.value)}>
            <option value="">Select a job posting</option>
            {jobPostings.map((jp: JobPosting) => (
              <option key={jp.id} value={jp.id}>
                {jp.title}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Full Name *</label>
          <input
            className={fieldClass}
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder="Farhana Akter"
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            className={fieldClass}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="farhana@example.com"
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
            className={fieldClass}
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+8801812345678"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Source</label>
          <input
            className={fieldClass}
            value={form.source}
            onChange={(e) => set('source', e.target.value)}
            placeholder="LinkedIn, Referral, Job Board..."
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Initial impressions, referral source details..."
          />
        </div>
      </form>
    </Modal>
  );
}
