import React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface SettingsCardProps {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  title: string;
  description: string;
  onClick?: () => void;
}

export function SettingsCard({ icon: Icon, iconBgColor, iconColor, title, description, onClick }: SettingsCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 hover:shadow-sm hover:border-blue-200 transition-all cursor-pointer group min-h-[90px]"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <h3 className="text-[13px] font-extrabold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors leading-tight truncate">{title}</h3>
        <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2">{description}</p>
      </div>
      <div className="shrink-0 pt-1 text-slate-300 group-hover:text-blue-400 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}
