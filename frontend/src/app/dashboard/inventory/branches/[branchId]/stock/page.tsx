'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { BranchStockView } from '@/features/branch/components/BranchStockView';

export default function BranchStockPage() {
  const params = useParams<{ branchId: string }>();
  return <BranchStockView branchId={params.branchId} />;
}
