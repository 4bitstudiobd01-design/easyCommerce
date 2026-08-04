'use client';

import { CampaignManagementTable } from '@/features/email-marketing/components/CampaignManagementTable';

export default function EmailMarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Email Marketing</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your email newsletters, promotions, and subscriber campaigns.</p>
      </div>
      <CampaignManagementTable />
    </div>
  );
}
