'use client';

import React from 'react';
import { CreatePlanFormData } from '../types';

interface PlanStatusCardProps {
  formData: CreatePlanFormData;
  onChange: (field: keyof CreatePlanFormData, value: any) => void;
}

export function PlanStatusCard({ formData, onChange }: PlanStatusCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 text-xs">
      <h3 className="font-bold text-slate-900 tracking-tight">Plan Status</h3>

      <div className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600 font-medium">Status</span>
          <select
            value={formData.status}
            onChange={(e) => onChange('status', e.target.value as any)}
            className={`px-3 py-1.5 rounded-xl font-bold border transition-colors outline-none cursor-pointer ${
              formData.status === 'Active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-600 font-medium">Visibility</span>
          <select
            value={formData.visibility}
            onChange={(e) => onChange('visibility', e.target.value as any)}
            className="px-3 py-1.5 rounded-xl font-semibold bg-slate-50 border border-slate-200 text-slate-800 outline-none cursor-pointer"
          >
            <option value="Visible to all merchants">Visible to all merchants</option>
            <option value="Hidden / Private">Hidden / Private</option>
            <option value="Enterprise Only">Enterprise Only</option>
          </select>
        </div>
      </div>
    </div>
  );
}
