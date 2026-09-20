'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { CalendarPlus, Paperclip, UploadCloud } from 'lucide-react';
import {
  LeaveType,
  useGetEmployeesQuery,
  useGetLeaveBalanceQuery,
  useCreateLeaveRequestMutation,
  useUploadLeaveDocumentMutation,
} from '../api/hrmApi';

interface CreateLeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEAVE_TYPES: LeaveType[] = ['EARNED', 'CASUAL', 'SICK', 'UNPAID'];

function inclusiveDayCount(start: string, end: string) {
  if (!start || !end) return 0;
  const days = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;
  return days > 0 ? days : 0;
}

export function CreateLeaveRequestModal({ isOpen, onClose }: CreateLeaveRequestModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { data: employeesPage } = useGetEmployeesQuery({ limit: 100 });
  const employees = employeesPage?.items ?? [];
  const { data: balance = [] } = useGetLeaveBalanceQuery({ employeeId }, { skip: !employeeId });
  const [createLeaveRequest, { isLoading: isCreating }] = useCreateLeaveRequestMutation();
  const [uploadDocument, { isLoading: isUploading }] = useUploadLeaveDocumentMutation();

  const balanceForType = balance.find((b) => b.leaveType === leaveType);
  const requestedDays = useMemo(() => inclusiveDayCount(startDate, endDate), [startDate, endDate]);

  const reset = () => {
    setEmployeeId('');
    setLeaveType('CASUAL');
    setStartDate('');
    setEndDate('');
    setReason('');
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !startDate || !endDate) {
      toast.error('Employee, start date, and end date are required.');
      return;
    }

    try {
      const request = await createLeaveRequest({ employeeId, leaveType, startDate, endDate, reason: reason || undefined }).unwrap();
      if (leaveType === 'SICK' && file) {
        await uploadDocument({ id: request.id, file }).unwrap();
      }
      toast.success('Leave request filed.');
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to file leave request.');
    }
  };

  const fieldClass =
    'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="New Leave Request"
      icon={<CalendarPlus className="w-5 h-5" />}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="leave-request-form"
            disabled={isCreating || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isCreating || isUploading ? 'Submitting...' : 'Submit Request'}
          </button>
        </>
      }
    >
      <form id="leave-request-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Employee</label>
          <select className={fieldClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Select an employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Leave Type</label>
            <select className={fieldClass} value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)}>
              {LEAVE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Start Date</label>
            <input type="date" className={fieldClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">End Date</label>
            <input type="date" className={fieldClass} value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {employeeId && balanceForType && (
          <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            requestedDays > balanceForType.remaining ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <span>
              {requestedDays > 0 ? `${requestedDays} day(s) requested` : 'Select dates to see day count'}
            </span>
            <span>{balanceForType.remaining} of {balanceForType.allocated} {leaveType.toLowerCase()} day(s) remaining</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason (optional)</label>
          <textarea
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe the reason for leave"
          />
        </div>

        {leaveType === 'SICK' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Medical Document (optional)</label>
            <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition">
              <UploadCloud className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 flex-1 truncate">
                {file ? (
                  <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <Paperclip className="w-3.5 h-3.5" /> {file.name}
                  </span>
                ) : (
                  'Upload a photo or PDF of the medical certificate'
                )}
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <p className="text-[10.5px] text-slate-400 mt-1">
              Stored privately — only visible to this employee and HR, never a public link.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}
