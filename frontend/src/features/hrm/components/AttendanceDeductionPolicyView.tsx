'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CircleSlash2, RefreshCw, Info } from 'lucide-react';
import { useGetAttendanceDeductionPolicyQuery, useUpdateAttendanceDeductionPolicyMutation } from '../api/hrmApi';

export function AttendanceDeductionPolicyView() {
  const { data: policy, isFetching, refetch } = useGetAttendanceDeductionPolicyQuery();
  const [updatePolicy, { isLoading: isSaving }] = useUpdateAttendanceDeductionPolicyMutation();

  const [lateArrivalsPerDeductedDay, setLateArrivalsPerDeductedDay] = useState(4);
  const [deductUnmarkedAbsences, setDeductUnmarkedAbsences] = useState(true);

  useEffect(() => {
    if (policy) {
      setLateArrivalsPerDeductedDay(policy.lateArrivalsPerDeductedDay);
      setDeductUnmarkedAbsences(policy.deductUnmarkedAbsences);
    }
  }, [policy]);

  const handleSave = async () => {
    if (lateArrivalsPerDeductedDay < 1) {
      toast.error('Late arrivals per deducted day must be at least 1.');
      return;
    }
    try {
      await updatePolicy({ lateArrivalsPerDeductedDay, deductUnmarkedAbsences }).unwrap();
      toast.success('Salary deduction policy saved.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save deduction policy.');
    }
  };

  const fieldClass =
    'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
            <CircleSlash2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Salary Deductions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Attendance &amp; leave rules used when payroll is generated</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Late arrivals per deducted day</label>
            <input
              type="number"
              min="1"
              step="1"
              value={lateArrivalsPerDeductedDay}
              onChange={(e) => setLateArrivalsPerDeductedDay(Math.max(1, Number(e.target.value) || 1))}
              className={fieldClass}
            />
            <p className="text-[10.5px] text-slate-400 mt-1">
              e.g. 4 means every 4 LATE-marked days in a payroll month count as 1 unpaid day.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Unmarked absences</label>
            <label className="flex items-center gap-2.5 h-10 px-3.5 border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={deductUnmarkedAbsences}
                onChange={(e) => setDeductUnmarkedAbsences(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-slate-700">Deduct a full day&apos;s pay for each unmarked absence</span>
            </label>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <strong>Formula:</strong> deducted days = unpaid leave days + ⌊late arrivals ÷ {Math.max(1, lateArrivalsPerDeductedDay)}⌋
            {deductUnmarkedAbsences ? ' + unmarked absent days' : ''} for that payroll month. Deducted amount = deducted
            days × (gross salary ÷ days in that month). This is computed once when a payroll run is generated, using
            that month&apos;s attendance and approved leave records — it does not change afterward.
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Policy'}
          </button>
        </div>
      </div>
    </div>
  );
}
