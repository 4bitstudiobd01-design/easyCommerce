'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { InventoryDetailsView } from '@/features/inventory/components/InventoryDetailsView';

export default function InventoryDetailsPage() {
  const params = useParams();
  const inventoryId = (params?.id as string) || '';

  return <InventoryDetailsView />;
}
