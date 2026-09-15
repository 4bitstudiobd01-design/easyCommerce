'use client';

import React from 'react';
import { AccountsTabsHeader } from '@/features/accounts/components/AccountsTabsHeader';

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full space-y-6">
      <AccountsTabsHeader />
      <div className="w-full">{children}</div>
    </div>
  );
}
