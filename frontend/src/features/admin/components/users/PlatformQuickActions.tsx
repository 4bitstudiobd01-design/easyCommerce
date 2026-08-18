import { LucideIcon, ChevronRight, Zap } from 'lucide-react';
import { WidgetCard } from '../core/WidgetCard';

export interface PlatformQuickAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  onClick: () => void;
}

export function PlatformQuickActions({ actions }: { actions: PlatformQuickAction[] }) {
  return (
    <WidgetCard title="Quick Actions" icon={Zap}>
      <div className="divide-y divide-slate-100">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className="w-full py-3 first:pt-0 last:pb-0 flex items-center gap-3 text-left hover:bg-slate-50/70 -mx-1 px-1 rounded-lg transition-colors"
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${action.iconBgColor || 'bg-blue-50'} ${
                action.iconTextColor || 'text-blue-600'
              }`}
            >
              <action.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-extrabold text-slate-900 truncate">{action.label}</span>
              <span className="block text-[11px] text-slate-400 font-medium truncate">{action.description}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        ))}
      </div>
    </WidgetCard>
  );
}
