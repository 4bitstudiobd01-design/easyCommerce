'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserPlus,
  CreditCard,
  FileText,
  Settings,
  Activity,
} from 'lucide-react';
import { QuickActionItem } from '../types/dashboard.types';

interface QuickActionsProps {
  actions: QuickActionItem[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const getActionIcon = (icon: QuickActionItem['icon']) => {
    switch (icon) {
      case 'create-merchant':
        return <UserPlus className="w-5 h-5 text-emerald-600" />;
      case 'create-plan':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'audit-logs':
        return <FileText className="w-5 h-5 text-emerald-600" />;
      case 'settings':
        return <Settings className="w-5 h-5 text-emerald-600" />;
      case 'health':
        return <Activity className="w-5 h-5 text-emerald-600" />;
      default:
        return <Activity className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-sm h-full flex flex-col justify-between">
      <h2 className="text-base font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-3 2xl:grid-cols-5 gap-2.5 sm:gap-3 flex-1 items-center">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="group flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/30 text-center transition-all hover:shadow-xs h-full min-h-[90px]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50/90 border border-emerald-100/60 flex items-center justify-center mb-1.5 group-hover:scale-105 group-hover:bg-emerald-100/80 transition-all shrink-0">
              {getActionIcon(action.icon)}
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors leading-tight line-clamp-2 text-center">
              {action.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
