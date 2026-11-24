'use client';

import React from 'react';
import { toast } from 'sonner';
import { Employee, EmploymentStatus, useUpdateEmployeeMutation } from '../api/hrmApi';

export const EMPLOYMENT_STATUS_BADGE: Record<EmploymentStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  ON_LEAVE: 'bg-amber-100 text-amber-800',
  SUSPENDED: 'bg-orange-100 text-orange-800',
  TERMINATED: 'bg-rose-100 text-rose-800',
};

const EMPLOYMENT_STATUS_BADGE_DARK: Record<EmploymentStatus, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  ON_LEAVE: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  SUSPENDED: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
  TERMINATED: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
};

const STATUSES: EmploymentStatus[] = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'];

interface EmploymentStatusDropdownProps {
  employee: Employee;
  className?: string;
  theme?: 'light' | 'dark';
  /** When the user picks TERMINATED, defer to the parent's confirmation modal
   *  instead of applying it immediately — termination is destructive. */
  onRequestTerminate?: (employee: Employee) => void;
}

export function EmploymentStatusDropdown({ employee, className, theme = 'light', onRequestTerminate }: EmploymentStatusDropdownProps) {
  const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();

  const handleChange = async (next: EmploymentStatus) => {
    if (next === employee.employmentStatus) return;
    if (next === 'TERMINATED' && onRequestTerminate) {
      onRequestTerminate(employee);
      return;
    }
    try {
      await updateEmployee({ id: employee.id, employmentStatus: next }).unwrap();
      toast.success('Employment status updated.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update employment status.');
    }
  };

  const badgeMap = theme === 'dark' ? EMPLOYMENT_STATUS_BADGE_DARK : EMPLOYMENT_STATUS_BADGE;

  return (
    <select
      value={employee.employmentStatus}
      disabled={isLoading}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => handleChange(e.target.value as EmploymentStatus)}
      className={`appearance-none cursor-pointer px-2.5 py-1 rounded-full text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70 ${theme === 'dark' ? 'border' : 'border-0'} ${badgeMap[employee.employmentStatus]} ${className ?? ''}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="text-slate-900">
          {s.replace('_', ' ')}
        </option>
      ))}
    </select>
  );
}
