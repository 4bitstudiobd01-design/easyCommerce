'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type DateRangePreset = 'today' | '7d' | '30d' | '90d' | '1y' | 'custom';

export interface DashboardFilterState {
  dateRangePreset: DateRangePreset;
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  planType?: 'FREE' | 'GROWTH' | 'ENTERPRISE';
  currency: string;
}

interface DashboardFilterContextValue {
  filters: DashboardFilterState;
  setDateRangePreset: (preset: DateRangePreset) => void;
  setCustomDateRange: (startDate: string, endDate: string) => void;
  setTenantId: (tenantId?: string) => void;
  setPlanType: (planType?: 'FREE' | 'GROWTH' | 'ENTERPRISE') => void;
  resetFilters: () => void;
}

const defaultFilters: DashboardFilterState = {
  dateRangePreset: '30d',
  currency: 'BDT',
};

const DashboardFilterContext = createContext<DashboardFilterContextValue | undefined>(undefined);

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilterState>(defaultFilters);

  const setDateRangePreset = (preset: DateRangePreset) => {
    setFilters((prev) => ({ ...prev, dateRangePreset: preset, startDate: undefined, endDate: undefined }));
  };

  const setCustomDateRange = (startDate: string, endDate: string) => {
    setFilters((prev) => ({ ...prev, dateRangePreset: 'custom', startDate, endDate }));
  };

  const setTenantId = (tenantId?: string) => {
    setFilters((prev) => ({ ...prev, tenantId }));
  };

  const setPlanType = (planType?: 'FREE' | 'GROWTH' | 'ENTERPRISE') => {
    setFilters((prev) => ({ ...prev, planType }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <DashboardFilterContext.Provider
      value={{
        filters,
        setDateRangePreset,
        setCustomDateRange,
        setTenantId,
        setPlanType,
        resetFilters,
      }}
    >
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  }
  return context;
}
