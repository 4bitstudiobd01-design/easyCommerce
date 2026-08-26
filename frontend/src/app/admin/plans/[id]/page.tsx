'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { INITIAL_PLANS } from '@/components/dashboard/plans/plansMockData';
import { PlanDetailsView } from '@/components/dashboard/plans/details/PlanDetailsView';
import { PlanRecord } from '@/components/dashboard/plans/types';

export default function PlanDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const planId = (params?.id as string) || 'plan-growth';

  // Find plan by id or lowercase name
  const foundPlan =
    INITIAL_PLANS.find(
      (p) =>
        p.id.toLowerCase() === planId.toLowerCase() ||
        p.name.toLowerCase() === planId.toLowerCase()
    ) || INITIAL_PLANS[0];

  const handleBack = () => {
    router.push('/admin/plans');
  };

  return (
    <PlanDetailsView
      plan={foundPlan}
      onBack={handleBack}
      onUpdatePlan={(updated: PlanRecord) => {
        // Updated plan handler
      }}
    />
  );
}
