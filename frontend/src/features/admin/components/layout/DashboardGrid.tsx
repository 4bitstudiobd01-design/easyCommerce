import React, { ReactNode } from 'react';

export interface DashboardGridProps {
  columns?: number;
  className?: string;
  children: ReactNode;
}

export function DashboardGrid({ columns = 12, className = '', children }: DashboardGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-start ${className}`}>
      {children}
    </div>
  );
}
