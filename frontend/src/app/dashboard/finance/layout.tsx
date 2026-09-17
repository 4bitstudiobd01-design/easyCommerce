'use client';

import React from 'react';
import { FinanceTabsHeader } from '@/features/finance/components/FinanceTabsHeader';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full space-y-6">
      {/* 1. Global Top Finance Sub-Navigation Tabs */}
      <FinanceTabsHeader />

      {/* 2. Finance View Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}
