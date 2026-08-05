import React from 'react';
import { LucideIcon } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

export interface ActivityItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
}

export interface ActivityCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  items?: ActivityItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  onRefresh?: () => void;
  onViewAll?: () => void;
  viewAllText?: string;
  className?: string;
}

export function ActivityCard({
  title,
  subtitle,
  icon,
  items = [],
  isLoading = false,
  isError = false,
  error,
  onRefresh,
  onViewAll,
  viewAllText = 'View All',
  className = '',
}: ActivityCardProps) {
  const headerAction = onViewAll ? (
    <button
      type="button"
      onClick={onViewAll}
      className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
    >
      {viewAllText}
    </button>
  ) : undefined;

  return (
    <WidgetCard
      title={title}
      subtitle={subtitle}
      icon={icon}
      headerAction={headerAction}
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={items.length === 0}
      emptyTitle="No recent activity"
      emptyDescription="Activities and logs will appear here when events occur."
      onRefresh={onRefresh}
      className={className}
    >
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs font-medium first:pt-0 last:pb-0">
              <div className="flex items-center gap-3 truncate">
                {ItemIcon && (
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    <ItemIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="truncate">
                  <span className="font-extrabold text-slate-900 dark:text-white block truncate">{item.title}</span>
                  {item.subtitle && <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">{item.subtitle}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.badge}
                <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}
