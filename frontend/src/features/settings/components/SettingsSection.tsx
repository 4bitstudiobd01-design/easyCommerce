import React from 'react';

interface SettingsSectionProps {
  title: string;
  subtitle: string;
  titleColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({ title, subtitle, titleColor = 'text-slate-900', children, className = '' }: SettingsSectionProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div>
        <h2 className={`text-[13px] font-bold ${titleColor} tracking-tight`}>{title}</h2>
        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
