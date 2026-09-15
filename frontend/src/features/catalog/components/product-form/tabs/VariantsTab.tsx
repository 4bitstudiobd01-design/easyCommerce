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
    numericBasePrice,
    currencySymbol,
    editId,
    sourceProduct,
    ensureProductSaved,
  } = form;

  return (
    <ProductVariantMatrix
      productId={editId}
      hasVariants={hasVariants}
      onHasVariantsChange={setHasVariants}
      existingVariants={sourceProduct?.variants || []}
      basePrice={numericBasePrice}
      currencySymbol={currencySymbol}
      onEnsureSaved={ensureProductSaved}
    />
  );
}
