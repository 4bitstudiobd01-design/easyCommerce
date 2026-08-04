'use client';

import { ThemeMarketplaceApp } from '@/features/tenant/components/ThemeMarketplaceApp';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';

export default function ThemesPage() {
  const { data: store } = useGetMyStoreQuery();

  return <ThemeMarketplaceApp store={store} />;
}
