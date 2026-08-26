'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Info } from 'lucide-react';
import { AlertNotificationItem } from '../types/dashboard.types';

interface AlertsNotificationsProps {
  alerts: AlertNotificationItem[];
}

export function AlertsNotifications({ alerts }: AlertsNotificationsProps) {
  const getIcon = (severity: AlertNotificationItem['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-emerald-600 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-gray-500 shrink-0" />;
    }
  };

  const getCardBorder = (severity: AlertNotificationItem['severity']) => {
    switch (severity) {
      case 'error':
        return 'border-rose-100 hover:border-rose-200 bg-rose-50/25';
      case 'warning':
        return 'border-amber-100 hover:border-amber-200 bg-amber-50/25';
      case 'info':
        return 'border-emerald-100 hover:border-emerald-200 bg-emerald-50/25';
      default:
        return 'border-gray-100 bg-gray-50/25';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-sm h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <h2 className="text-base font-bold text-gray-900">Alerts & Notifications</h2>
        <Link
          href="/admin/notifications"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
        >
          View All
        </Link>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 2xl:grid-cols-4 gap-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3.5 rounded-xl border ${getCardBorder(
              alert.severity
            )} transition-all hover:shadow-xs flex flex-col justify-between min-h-[90px]`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                {getIcon(alert.severity)}
                <span className="text-xs font-bold text-gray-900 truncate">
                  {alert.title}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-snug line-clamp-2">
                {alert.description}
              </p>
            </div>

            <span className="text-[10px] text-gray-400 font-medium mt-2 block">
              {alert.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
