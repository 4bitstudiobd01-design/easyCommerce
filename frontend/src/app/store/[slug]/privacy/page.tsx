'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useGetStoreBySlugQuery } from '@/features/tenant/api/tenantApi';
import { StorePolicyPage } from '@/features/storefront/components/StorePolicyPage';

export default function StorePrivacyPolicyPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { data: store } = useGetStoreBySlugQuery(slug, { skip: !slug });

  return (
    <StorePolicyPage
      title="Privacy Policy"
      content={store?.privacyPolicy}
      emptyMessage="This store has not published a privacy policy yet."
    />
  );
}
