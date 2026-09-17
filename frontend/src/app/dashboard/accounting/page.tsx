'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AccountingOverviewView } from '@/features/accounting/components/AccountingOverviewView';

export default function AccountingOverviewPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/finance/accounts');
  }, [router]);

  return (
    <div className="p-6">
      <div className="animate-pulse text-sm text-slate-500 font-medium">
        Redirecting to Finance Accounts...
      </div>
      <div className="hidden">
        <AccountingOverviewView />
      </div>
    </div>
  );
}
