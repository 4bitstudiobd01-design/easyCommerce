import React from 'react';
import { LucideIcon, Bell, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity?: NotificationSeverity;
  isRead?: boolean;
}

export interface NotificationCardProps {
  title?: string;
  notifications?: NotificationItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function NotificationCard({
  title = 'Notifications & Alerts',
  notifications = [],
  isLoading = false,
  isError = false,
  onRefresh,
  className = '',
}: NotificationCardProps) {
  const getSeverityIcon = (severity?: NotificationSeverity) => {
    switch (severity) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <WidgetCard
      title={title}
      icon={Bell}
      isLoading={isLoading}
      isError={isError}
      isEmpty={notifications.length === 0}
      emptyTitle="No notifications"
      emptyDescription="You're all caught up! System notifications will appear here."
      onRefresh={onRefresh}
      className={className}
    >
      <div className="space-y-3">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
              item.isRead
                ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-75'
                : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 shadow-xs'
            }`}
          >
            <div className="mt-0.5 shrink-0">{getSeverityIcon(item.severity)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h5 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{item.title}</h5>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">{item.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
