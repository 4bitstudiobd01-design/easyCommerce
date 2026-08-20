'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CreatePlanView } from '@/components/dashboard/plans/create/CreatePlanView';
import { PlanRecord } from '@/components/dashboard/plans/types';

export default function CreatePlanPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/admin/plans');
  };

  const handleCreatePlan = (newPlan: PlanRecord) => {
    // Created plan
  };

  return <CreatePlanView onBack={handleBack} onCreatePlan={handleCreatePlan} />;
}
