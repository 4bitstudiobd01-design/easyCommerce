'use client';

import React from 'react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { ProductVariantMatrix } from '@/features/catalog/components/ProductVariantMatrix';

interface VariantsTabProps {
  form: ProductFormState;
}

export function VariantsTab({ form }: VariantsTabProps) {
  const {
    hasVariants,
    setHasVariants,
    pendingVariants,
    setPendingVariants,
    numericBasePrice,
    numericCompareAt,
    currencySymbol,
    editId,
    sourceProduct,
  } = form;

  return (
    <ProductVariantMatrix
      productId={editId}
      hasVariants={hasVariants}
      onHasVariantsChange={setHasVariants}
      existingVariants={sourceProduct?.variants || []}
      pendingVariants={pendingVariants}
      onPendingVariantsChange={setPendingVariants}
      basePrice={numericBasePrice}
      compareAtPrice={numericCompareAt}
      currencySymbol={currencySymbol}
    />
  );
}
