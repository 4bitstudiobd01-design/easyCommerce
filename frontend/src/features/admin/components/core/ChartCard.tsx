import React from 'react';
import { LucideIcon } from 'lucide-react';
import { WidgetCard } from './WidgetCard';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actionSelector?: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  isEmpty?: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  icon,
  actionSelector,
  isLoading = false,
  isError = false,
  error,
  isEmpty = false,
  lastUpdated,
  onRefresh,
  className = '',
  children,
}: ChartCardProps) {
  return (
    <WidgetCard
      title={title}
      subtitle={subtitle}
      icon={icon}
      headerAction={actionSelector}
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={isEmpty}
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
      className={className}
    >
      <div className="pt-2">{children}</div>
    </WidgetCard>
  );
}
