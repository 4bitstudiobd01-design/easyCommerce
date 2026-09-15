'use client';

import React from 'react';
import { HRTabsHeader } from '@/features/hrm/components/HRTabsHeader';

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full space-y-6">
      {/* 1. Global Top HR Sub-Navigation Tabs */}
      <HRTabsHeader />

      {/* 2. HR View Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}
