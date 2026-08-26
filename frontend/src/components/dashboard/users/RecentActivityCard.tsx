'use client';

import React from 'react';
import {
  UserPlus,
  Edit,
  UserX,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserActivityItem } from './types';
import { RECENT_ACTIVITIES } from './usersMockData';

interface RecentActivityCardProps {
  activities?: UserActivityItem[];
  onViewAll?: () => void;
}

export function RecentActivityCard({
  activities = RECENT_ACTIVITIES,
  onViewAll,
}: RecentActivityCardProps) {
  const getActivityIcon = (type: UserActivityItem['type']) => {
    const iconClass = 'w-3.5 h-3.5';
    switch (type) {
      case 'add':
        return (
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <UserPlus className={iconClass} />
          </div>
        );
      case 'update':
        return (
          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Edit className={iconClass} />
          </div>
        );
      case 'deactivate':
        return (
          <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <UserX className={iconClass} />
          </div>
        );
      case 'reset':
        return (
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <KeyRound className={iconClass} />
          </div>
        );
      case '2fa':
        return (
          <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <ShieldCheck className={iconClass} />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
          Recent Activity
        </h3>
        <button
          type="button"
          onClick={() => {
            if (onViewAll) onViewAll();
            else toast.info('Navigating to full audit logs...');
          }}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-3.5 pt-1">
        {activities.map((act) => (
          <div key={act.id} className="flex items-start gap-3 text-xs">
            {getActivityIcon(act.type)}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-800 leading-tight">
                {act.title}
              </h4>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {act.description}
              </p>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {act.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
