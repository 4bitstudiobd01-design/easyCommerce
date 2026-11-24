'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Briefcase } from 'lucide-react';
import {
  JobPosting,
  EmploymentType,
  JobPostingStatus,
  useGetDepartmentsQuery,
  useCreateJobPostingMutation,
  useUpdateJobPostingMutation,
} from '../api/hrmApi';

interface JobPostingFormModalProps {
  isOpen: boolean;
  jobPosting: JobPosting | null;
  onClose: () => void;
}

const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
const STATUSES: JobPostingStatus[] = ['OPEN', 'ON_HOLD', 'CLOSED'];

const fieldClass =
  'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white';
const labelClass = 'block text-xs font-bold text-slate-700 mb-1.5';

const emptyForm = {
  title: '',
  departmentId: '',
  employmentType: '' as EmploymentType | '',
  location: '',
  openings: '1',
  status: 'OPEN' as JobPostingStatus,
  description: '',
};

export function JobPostingFormModal({ isOpen, jobPosting, onClose }: JobPostingFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const { data: departments = [] } = useGetDepartmentsQuery();
  const [createJobPosting, { isLoading: isCreating }] = useCreateJobPostingMutation();
  const [updateJobPosting, { isLoading: isUpdating }] = useUpdateJobPostingMutation();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) return;
    if (jobPosting) {
      setForm({
        title: jobPosting.title,
        departmentId: jobPosting.departmentId ?? '',
        employmentType: jobPosting.employmentType ?? '',
        location: jobPosting.location ?? '',
        openings: String(jobPosting.openings ?? 1),
        status: jobPosting.status,
        description: jobPosting.description ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [isOpen, jobPosting]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required.');

    const payload = {
      title: form.title,
      departmentId: form.departmentId || undefined,
      employmentType: form.employmentType || undefined,
      location: form.location || undefined,
      openings: form.openings ? Number(form.openings) : undefined,
      description: form.description || undefined,
    };

    try {
      if (jobPosting) {
        await updateJobPosting({
          id: jobPosting.id,
          ...payload,
          departmentId: form.departmentId || null,
          status: form.status,
        }).unwrap();
        toast.success('Job posting updated.');
      } else {
        await createJobPosting(payload).unwrap();
        toast.success('Job posting created.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save job posting.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={jobPosting ? 'Edit Job Posting' : 'New Job Posting'}
      subtitle={jobPosting ? jobPosting.title : 'Open a new role for your team'}
      icon={<Briefcase className="w-5 h-5" />}
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
            form="job-posting-form"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : jobPosting ? 'Save Changes' : 'Create Posting'}
          </button>
        </>
      }
    >
      <form id="job-posting-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Job Title *</label>
          <input
            className={fieldClass}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Senior Frontend Engineer"
          />
        </div>
        <div>
          <label className={labelClass}>Department</label>
          <select className={fieldClass} value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
            <option value="">Unassigned</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Employment Type</label>
          <select
            className={fieldClass}
            value={form.employmentType}
            onChange={(e) => set('employmentType', e.target.value as EmploymentType)}
          >
            <option value="">Not specified</option>
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input
            className={fieldClass}
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Dhaka, Bangladesh"
          />
        </div>
        <div>
          <label className={labelClass}>Openings</label>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={form.openings}
            onChange={(e) => set('openings', e.target.value)}
          />
        </div>
        {jobPosting && (
          <div className="sm:col-span-2">
            <label className={labelClass}>Status</label>
            <select className={fieldClass} value={form.status} onChange={(e) => set('status', e.target.value as JobPostingStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
            rows={4}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Role responsibilities, requirements..."
          />
        </div>
      </form>
    </Modal>
  );
}
