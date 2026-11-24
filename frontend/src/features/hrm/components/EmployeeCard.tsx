'use client';

import React from 'react';
import { Briefcase, KeyRound } from 'lucide-react';
import { Employee } from '../api/hrmApi';
import { EmploymentStatusDropdown } from './EmploymentStatusDropdown';

interface EmployeeCardProps {
  employee: Employee;
  onView: (employee: Employee) => void;
  onRequestTerminate?: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onView, onRequestTerminate }: EmployeeCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(employee)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onView(employee);
      }}
      className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition p-5 flex flex-col gap-4 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-900 text-white font-extrabold text-base rounded-full flex items-center justify-center uppercase shrink-0 shadow-sm">
            {employee.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 leading-tight truncate">{employee.fullName}</div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">{employee.employeeCode}</div>
          </div>
        </div>
        {employee.linkedUserId && (
          <span className="text-emerald-500 shrink-0" title="Self-service login linked">
            <KeyRound className="w-4 h-4" />
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-semibold text-slate-800 truncate">
          {employee.designation || <span className="text-slate-300 font-normal">No designation</span>}
        </div>
        <div className="text-xs text-slate-500 truncate">
          {employee.department?.name || <span className="text-slate-300">Unassigned department</span>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
          {employee.employmentType.replace('_', ' ')}
        </span>
        <EmploymentStatusDropdown employee={employee} onRequestTerminate={onRequestTerminate} />
      </div>
    </div>
  );
}
