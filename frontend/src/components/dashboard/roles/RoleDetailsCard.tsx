'use client';

import React from 'react';
import { RoleRecord } from './types';

interface RoleDetailsCardProps {
  role: RoleRecord;
  onViewUsers?: (role: RoleRecord) => void;
}

export function RoleDetailsCard({ role, onViewUsers }: RoleDetailsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header */}
      <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
        Role Details
      </h3>

      {/* Role Title & Badge */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-extrabold text-slate-900">
            {role.name}
          </h4>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
              role.type === 'System Role'
                ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                : 'bg-amber-50 text-amber-700 border border-amber-200/60'
            }`}
          >
            {role.type}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
          {role.description}
        </p>
      </div>

      {/* Attributes Key-Value List */}
      <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
        {/* Users */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Users</span>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#008060] flex items-center justify-center text-xs font-bold border border-emerald-200/60">
              {role.usersCount}
            </span>
            <button
              type="button"
              onClick={() => onViewUsers?.(role)}
              className="text-xs font-bold text-[#008060] hover:text-[#006e52] cursor-pointer transition-colors"
            >
              View Users
            </button>
          </div>
        </div>

        {/* Created At */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Created At</span>
          <span className="font-semibold text-slate-700 text-[11px]">
            {role.createdAtDate} {role.createdAtTime}
          </span>
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Last Updated</span>
          <span className="font-semibold text-slate-700 text-[11px]">
            {role.lastUpdatedDate} {role.lastUpdatedTime}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Status</span>
          <span className="font-bold text-emerald-600">
            {role.status}
          </span>
        </div>
      </div>
    </div>
  );
}
