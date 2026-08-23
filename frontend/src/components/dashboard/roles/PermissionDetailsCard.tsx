'use client';

import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  Layers,
  ArrowLeftRight,
  Headphones,
  BarChart2,
} from 'lucide-react';
import { PermissionRecord } from './types';

interface PermissionDetailsCardProps {
  permission: PermissionRecord;
}

export function PermissionDetailsCard({
  permission,
}: PermissionDetailsCardProps) {
  const getModuleIcon = (name: string) => {
    const iconClass = 'w-3.5 h-3.5 text-slate-500';
    switch (name) {
      case 'Dashboard':
        return <LayoutDashboard className={iconClass} />;
      case 'Merchants':
        return <Users className={iconClass} />;
      case 'Stores':
        return <Store className={iconClass} />;
      case 'Subscriptions':
        return <CreditCard className={iconClass} />;
      case 'Plans':
        return <Layers className={iconClass} />;
      case 'Transactions':
        return <ArrowLeftRight className={iconClass} />;
      case 'Support':
        return <Headphones className={iconClass} />;
      case 'Reports':
        return <BarChart2 className={iconClass} />;
      default:
        return <LayoutDashboard className={iconClass} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header */}
      <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
        Permission Details
      </h3>

      {/* Permission Icon + Title + Key */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#008060] flex items-center justify-center border border-emerald-100 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
            {permission.name}
          </h4>
          <span className="font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 inline-block">
            {permission.permissionKey}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1 pt-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase">
          Description
        </span>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          {permission.description}
        </p>
      </div>

      {/* Attributes Key-Value List */}
      <div className="space-y-3 pt-2 text-xs border-t border-slate-100">
        {/* Module */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Module</span>
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            {getModuleIcon(permission.module)}
            <span>{permission.module}</span>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Action</span>
          <span className="font-semibold text-slate-800">
            {permission.action}
          </span>
        </div>

        {/* Type */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Type</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
              permission.type === 'System'
                ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                : 'bg-amber-50 text-amber-700 border border-amber-200/60'
            }`}
          >
            {permission.type} Permission
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Status</span>
          <div className="flex items-center gap-1.5 font-bold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active</span>
          </div>
        </div>

        {/* Created At */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Created At</span>
          <span className="font-semibold text-slate-700 text-[11px]">
            {permission.createdAtDate} {permission.createdAtTime}
          </span>
        </div>

        {/* Updated At */}
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Updated At</span>
          <span className="font-semibold text-slate-700 text-[11px]">
            {permission.updatedAtDate} {permission.updatedAtTime}
          </span>
        </div>
      </div>
    </div>
  );
}
