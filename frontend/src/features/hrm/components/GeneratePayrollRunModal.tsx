'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { CalendarClock } from 'lucide-react';
import { useGeneratePayrollRunMutation } from '../api/hrmApi';

interface GeneratePayrollRunModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function GeneratePayrollRunModal({ isOpen, onClose }: GeneratePayrollRunModalProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [generatePayrollRun, { isLoading }] = useGeneratePayrollRunMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await generatePayrollRun({ month, year }).unwrap();
      toast.success(`Payroll run generated for ${MONTHS[month - 1]} ${year}.`);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to generate payroll run.');
    }
  };

  const fieldClass =
    'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Payroll Run"
      icon={<CalendarClock className="w-5 h-5" />}
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
            form="generate-payroll-form"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </>
      }
    >
      <form id="generate-payroll-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Month</label>
            <select className={fieldClass} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Year</label>
            <input type="number" className={fieldClass} value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          Creates one payslip per active employee that has a salary structure set. Employees without one are skipped and
          counted, not silently dropped.
        </p>
      </form>
    </Modal>
  );
}
