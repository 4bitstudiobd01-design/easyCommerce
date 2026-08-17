'use client';

import React from 'react';
import {
  Terminal,
  Database,
  Box,
  Clock,
  HardDrive,
  CreditCard,
  AlertTriangle,
  GitFork,
  Check,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { InfoTooltip } from '../common/InfoTooltip';
import { ServiceStatus, PlatformHealthMetric } from '../types/dashboard.types';

interface PlatformHealthCardProps {
  services: ServiceStatus[];
  metrics: PlatformHealthMetric[];
}

export function PlatformHealthCard({ services, metrics }: PlatformHealthCardProps) {
  const getServiceIcon = (icon: string) => {
    const iconClass = 'w-3.5 h-3.5 shrink-0';
    switch (icon) {
      case 'api':
        return <Terminal className={`${iconClass} text-emerald-600`} />;
      case 'database':
        return <Database className={`${iconClass} text-emerald-600`} />;
      case 'redis':
        return <Box className={`${iconClass} text-emerald-600`} />;
      case 'jobs':
        return <Clock className={`${iconClass} text-emerald-600`} />;
      case 'storage':
        return <HardDrive className={`${iconClass} text-emerald-600`} />;
      case 'payment':
        return <CreditCard className={`${iconClass} text-emerald-600`} />;
      case 'courier':
        return <AlertTriangle className={`${iconClass} text-amber-500`} />;
      case 'webhooks':
        return <GitFork className={`${iconClass} text-emerald-600`} />;
      default:
        return <Terminal className={`${iconClass} text-emerald-600`} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-4 lg:p-4.5 shadow-sm flex flex-col justify-between overflow-hidden min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[14px] sm:text-[15px] font-bold text-gray-900">Platform Health</h2>
          <InfoTooltip content="Real-time uptime, response latencies, and service infrastructure health." />
        </div>
      </div>

      {/* 2 Columns: Services on Left, Platform Metrics on Right */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 items-start flex-1">
        {/* Left Column: Services list (8 services) */}
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between text-[11px] leading-tight py-0.5"
            >
              {/* Left icon + service name */}
              <div className="flex items-center gap-1.5 text-slate-800 font-medium min-w-0">
                {getServiceIcon(service.icon)}
                <span className="text-[11px] text-slate-800 font-medium whitespace-nowrap">
                  {service.name}
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1 shrink-0 pl-1">
                <div
                  className={`w-3 h-3 rounded-full flex items-center justify-center text-white shrink-0 ${
                    service.status === 'Operational' ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                >
                  <Check className="w-2 h-2 stroke-[3]" />
                </div>
                <span className="text-[10px] sm:text-[10.5px] text-slate-600 font-medium whitespace-nowrap">
                  {service.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Platform Metrics (6 metrics) */}
        <div className="space-y-2.5 border-l border-slate-100 pl-2 sm:pl-2.5">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-[11px] leading-tight">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10.5px] sm:text-[11px] text-slate-600 font-medium whitespace-nowrap">
                  {metric.label}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-bold text-[11px] sm:text-[11.5px] text-slate-900 tabular-nums whitespace-nowrap">
                    {metric.value}
                  </span>

                  {metric.change && (
                    <span
                      className={`text-[9px] sm:text-[9.5px] font-semibold flex items-center justify-end whitespace-nowrap ${
                        metric.isPositive ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {metric.isPositive ? (
                        <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />
                      )}
                      {metric.change}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar for storage */}
              {metric.type === 'progress' && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${metric.progressValue || 78}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
