'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useGetStoreBySlugQuery } from '@/features/tenant/api/tenantApi';
import { StorePolicyPage } from '@/features/storefront/components/StorePolicyPage';

export default function StoreTermsOfServicePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { data: store } = useGetStoreBySlugQuery(slug, { skip: !slug });

  return (
    <StorePolicyPage
      title="Terms of Service"
      content={store?.termsOfService}
      emptyMessage="This store has not published its terms of service yet."
    />
  );
}
