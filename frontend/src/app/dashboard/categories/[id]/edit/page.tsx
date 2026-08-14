'use client';

import { useParams } from 'next/navigation';
import { EditCategoryView } from '@/features/catalog/components/EditCategoryView';

export default function EditCategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;

  return <EditCategoryView categoryId={categoryId} />;
}
