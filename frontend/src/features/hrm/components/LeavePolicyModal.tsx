'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Settings } from 'lucide-react';
import { useGetLeavePolicyQuery, useUpdateLeavePolicyMutation } from '../api/hrmApi';

interface LeavePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeavePolicyModal({ isOpen, onClose }: LeavePolicyModalProps) {
  const { data: policy } = useGetLeavePolicyQuery(undefined, { skip: !isOpen });
  const [updatePolicy, { isLoading }] = useUpdateLeavePolicyMutation();

  const [earned, setEarned] = useState(15);
  const [casual, setCasual] = useState(10);
  const [sick, setSick] = useState(14);

  useEffect(() => {
    if (policy) {
      setEarned(policy.earnedDaysPerYear);
      setCasual(policy.casualDaysPerYear);
      setSick(policy.sickDaysPerYear);
    }
  }, [policy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePolicy({ earnedDaysPerYear: earned, casualDaysPerYear: casual, sickDaysPerYear: sick }).unwrap();
      toast.success('Leave policy updated.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update leave policy.');
    }
  };

  const fieldClass =
    'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leave Policy"
      subtitle="Annual day allocation per employee"
      icon={<Settings className="w-5 h-5" />}
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
            form="leave-policy-form"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Policy'}
          </button>
        </>
      }
    >
      <form id="leave-policy-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Earned Leave (days/year)</label>
          <input type="number" min={0} className={fieldClass} value={earned} onChange={(e) => setEarned(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Casual Leave (days/year)</label>
          <input type="number" min={0} className={fieldClass} value={casual} onChange={(e) => setCasual(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Sick Leave (days/year)</label>
          <input type="number" min={0} className={fieldClass} value={sick} onChange={(e) => setSick(Number(e.target.value))} />
        </div>
      </form>
    </Modal>
  );
}
