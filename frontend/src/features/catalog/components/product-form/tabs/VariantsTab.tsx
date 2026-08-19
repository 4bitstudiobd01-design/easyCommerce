'use client';

import React from 'react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { ProductVariantMatrix } from '@/features/catalog/components/ProductVariantMatrix';

interface VariantsTabProps {
  form: ProductFormState;
}

export function VariantsTab({ form }: VariantsTabProps) {
  const { hasVariants, setHasVariants, numericBasePrice, currencySymbol } = form;

  return (
    <ProductVariantMatrix
      hasVariants={hasVariants}
      onHasVariantsChange={setHasVariants}
      basePrice={numericBasePrice}
      currencySymbol={currencySymbol}
    />
  );
}
