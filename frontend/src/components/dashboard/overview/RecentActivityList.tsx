'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserPlus,
  ArrowUpCircle,
  CreditCard,
  UserX,
  Store,
} from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { RecentActivityItem } from '../types/dashboard.types';

interface RecentActivityListProps {
  activities: RecentActivityItem[];
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  const getActivityIcon = (type: RecentActivityItem['type']) => {
    switch (type) {
      case 'merchant':
        return (
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserPlus className="w-3.5 h-3.5" />
          </div>
        );
      case 'subscription':
        return (
          <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ArrowUpCircle className="w-3.5 h-3.5" />
          </div>
        );
      case 'payment':
        return (
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
        );
      case 'suspended':
        return (
          <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <UserX className="w-3.5 h-3.5" />
          </div>
        );
      case 'store':
        return (
          <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Store className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center shrink-0">
            <UserPlus className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-4 lg:p-4.5 shadow-sm flex flex-col justify-between overflow-hidden min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[14px] sm:text-[15px] font-bold text-gray-900">Recent Activity</h2>
          <InfoTooltip content="Audit stream of administrative and merchant actions." />
        </div>

        <Link
          href="/admin/audit-logs"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Activity Items List */}
      <div className="space-y-2.5 divide-y divide-gray-50 flex-1">
        {activities.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center justify-between gap-2.5 ${idx > 0 ? 'pt-2' : ''}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {getActivityIcon(item.type)}
              <div className="min-w-0">
                <span className="text-[11.5px] font-bold text-gray-900 block truncate">
                  {item.title}
                </span>
                <span className="text-[10.5px] text-gray-500 block truncate">
                  {item.description}
                </span>
              </div>
            </div>

            <span className="text-[10.5px] text-gray-400 font-medium whitespace-nowrap shrink-0">
              {item.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
