'use client';

import React from 'react';
import { StatCard } from './StatCard';
import { KpiMetric } from '../types/dashboard.types';

interface KpiStatsGridProps {
  metrics: KpiMetric[];
}

export function KpiStatsGrid({ metrics }: KpiStatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3.5 sm:gap-4">
      {metrics.map((metric) => (
        <StatCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
