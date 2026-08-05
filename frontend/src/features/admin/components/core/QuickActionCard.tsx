import React from 'react';
import { LucideIcon, Zap } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

export interface QuickActionItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  isDisabled?: boolean;
}

export interface QuickActionCardProps {
  title?: string;
  subtitle?: string;
  actions?: QuickActionItem[];
  isLoading?: boolean;
  className?: string;
}

export function QuickActionCard({
  title = 'Quick Actions',
  subtitle = 'Frequently used administrative controls',
  actions = [],
  isLoading = false,
  className = '',
}: QuickActionCardProps) {
  const getVariantClasses = (variant?: 'primary' | 'secondary' | 'danger') => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'danger':
        return 'bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <WidgetCard title={title} subtitle={subtitle} icon={Zap} isLoading={isLoading} className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              disabled={action.isDisabled}
              className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95 ${getVariantClasses(
                action.variant
              )}`}
            >
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 shadow-xs shrink-0">
                <ActionIcon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="block font-extrabold truncate">{action.label}</span>
                {action.description && (
                  <span className="block text-[10px] font-normal opacity-80 truncate">{action.description}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </WidgetCard>
  );
}
