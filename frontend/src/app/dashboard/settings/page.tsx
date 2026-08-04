'use client';

import { StoreSettingsForm } from '@/features/tenant/components/StoreSettingsForm';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';

export default function SettingsPage() {
  const { data: store } = useGetMyStoreQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Store Settings & Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">Configure tenant properties, currency, phone number, and courier API keys.</p>
      </div>

      <StoreSettingsForm
        store={store || null}
        initialActiveCard={null}
      />
    </div>
  );
}
