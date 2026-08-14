'use client';

import { useParams } from 'next/navigation';
import { CategoryDetailsView } from '@/features/catalog/components/CategoryDetailsView';

export default function CategoryDetailsPage() {
  const params = useParams();
  const categoryId = params.id as string;

  return <CategoryDetailsView categoryId={categoryId} />;
}
