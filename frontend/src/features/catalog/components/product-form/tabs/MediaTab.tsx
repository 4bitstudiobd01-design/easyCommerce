'use client';

import React from 'react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { ProductMediaGallery } from '@/features/catalog/components/ProductMediaGallery';

interface MediaTabProps {
  form: ProductFormState;
}

export function MediaTab({ form }: MediaTabProps) {
  const { localImages, setLocalImages } = form;

  return <ProductMediaGallery localImages={localImages} onLocalImagesChange={setLocalImages} />;
}
