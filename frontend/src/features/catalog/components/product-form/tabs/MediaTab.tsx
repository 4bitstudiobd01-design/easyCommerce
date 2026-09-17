'use client';

import React from 'react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { ProductMediaGallery } from '@/features/catalog/components/ProductMediaGallery';

interface MediaTabProps {
  form: ProductFormState;
}

export function MediaTab({ form }: MediaTabProps) {
  const { localImages, setLocalImages, editId } = form;

  // In edit mode the product already exists, so pass its id — the gallery then
  // attaches each upload to the product immediately (addMedia) instead of only
  // holding URLs in form state, which the update payload no longer carries.
  return (
    <ProductMediaGallery
      productId={editId || undefined}
      localImages={localImages}
      onLocalImagesChange={setLocalImages}
    />
  );
}
