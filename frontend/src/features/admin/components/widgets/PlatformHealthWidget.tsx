import React from 'react';
import { Activity, Database, Server, Cpu, Layers, HardDrive } from 'lucide-react';
import { WidgetCard } from '../core/WidgetCard';
import { StatusBadge, StatusVariant } from '../core/StatusBadge';

export interface HealthItem {
  name: string;
  status: StatusVariant;
  label?: string;
  metric?: string;
}

export interface PlatformHealthData {
  overallStatus: StatusVariant;
  overallLabel?: string;
  items: HealthItem[];
}

export interface PlatformHealthWidgetProps {
  data?: PlatformHealthData;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

const defaultHealthData: PlatformHealthData = {
  overallStatus: 'operational',
  overallLabel: 'All Systems Operational',
  items: [
    { name: 'API Gateway', status: 'operational', metric: 'P99: 42ms' },
    { name: 'PostgreSQL DB', status: 'operational', metric: 'Conn: 14/100' },
    { name: 'Redis Cache', status: 'operational', metric: 'Hit: 99.4%' },
    { name: 'BullMQ Queue', status: 'operational', metric: 'Jobs: 0 pending' },
    { name: 'S3 Cloud Storage', status: 'operational', metric: 'Uptime: 99.99%' },
  ],
};

export function PlatformHealthWidget({
  data = defaultHealthData,
  isLoading = false,
  isError = false,
  error,
  lastUpdated,
  onRefresh,
  className = '',
}: PlatformHealthWidgetProps) {
  const getIconForService = (name: string) => {
    if (name.includes('API')) return Server;
    if (name.includes('DB') || name.includes('Postgre')) return Database;
    if (name.includes('Redis')) return Cpu;
    if (name.includes('Queue') || name.includes('Bull')) return Layers;
    if (name.includes('Storage') || name.includes('S3')) return HardDrive;
    return Activity;
  };

  return (
    <WidgetCard
      title="Platform Health & Telemetry"
      subtitle="Infrastructure microservices status"
      icon={Activity}
      iconBgColor="bg-emerald-50 dark:bg-emerald-950/50"
      iconTextColor="text-emerald-600 dark:text-emerald-400"
      headerAction={<StatusBadge status={data.overallStatus} label={data.overallLabel} />}
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={!data.items || data.items.length === 0}
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
      className={className}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {data.items?.map((item) => {
          const ServiceIcon = getIconForService(item.name);
          return (
            <div
              key={item.name}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded-xl text-slate-500 border border-slate-200/50 dark:border-slate-700 shrink-0">
                  <ServiceIcon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                    {item.name}
                  </span>
                  {item.metric && (
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {item.metric}
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge status={item.status} label={item.label} />
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}
