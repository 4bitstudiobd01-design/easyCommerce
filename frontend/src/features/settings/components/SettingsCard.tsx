import React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface SettingsCardProps {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  title: string;
  description: string;
  onClick: () => void;
  /** Renders the card in destructive styling for danger-zone actions. */
  danger?: boolean;
}

export function SettingsCard({
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  description,
  onClick,
  danger = false,
}: SettingsCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-white border rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 cursor-pointer group min-h-[90px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        danger
          ? 'border-red-200 hover:border-red-300 hover:bg-red-50/40 hover:shadow-sm focus-visible:ring-red-500'
          : 'border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-slate-200/60 hover:-translate-y-0.5 focus-visible:ring-blue-500'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconBgColor}`}
      >
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <h3
          className={`text-[13px] font-extrabold mb-1 transition-colors leading-tight truncate ${
            danger ? 'text-red-700 group-hover:text-red-800' : 'text-slate-900 group-hover:text-blue-600'
          }`}
        >
          {title}
        </h3>
        <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2">{description}</p>
      </div>

      <div
        className={`shrink-0 pt-1 transition-all duration-200 group-hover:translate-x-0.5 ${
          danger ? 'text-red-300 group-hover:text-red-500' : 'text-slate-300 group-hover:text-blue-500'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
}
