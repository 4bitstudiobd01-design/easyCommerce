'use client';

import React from 'react';
import { useProductForm } from '@/features/catalog/hooks/useProductForm';
import { ProductFormShell } from '@/features/catalog/components/product-form/ProductFormShell';
import { GeneralTab } from '@/features/catalog/components/product-form/tabs/GeneralTab';
import { MediaTab } from '@/features/catalog/components/product-form/tabs/MediaTab';
import { OrganizationTab } from '@/features/catalog/components/product-form/tabs/OrganizationTab';
import { PricingTab } from '@/features/catalog/components/product-form/tabs/PricingTab';
import { InventoryTab } from '@/features/catalog/components/product-form/tabs/InventoryTab';
import { VariantsTab } from '@/features/catalog/components/product-form/tabs/VariantsTab';
import { ShippingTab } from '@/features/catalog/components/product-form/tabs/ShippingTab';

export default function CreateProductPage() {
  const form = useProductForm();

  return (
    <ProductFormShell form={form}>
      {/* 1. General Section */}
      <section id="section-general" className="scroll-mt-24 space-y-5">
        <GeneralTab form={form} />
      </section>

      {/* 2. Media Section */}
      <section id="section-media" className="scroll-mt-24 space-y-5">
        <MediaTab form={form} />
      </section>

      {/* 3. Organization Section */}
      <section id="section-organization" className="scroll-mt-24 space-y-5">
        <OrganizationTab form={form} />
      </section>

      {/* 4. Pricing Section */}
      <section id="section-pricing" className="scroll-mt-24 space-y-5">
        <PricingTab form={form} />
      </section>

      {/* 5. Inventory Section */}
      <section id="section-inventory" className="scroll-mt-24 space-y-5">
        <InventoryTab form={form} />
      </section>

      {/* 6. Variants Section */}
      <section id="section-variants" className="scroll-mt-24 space-y-5">
        <VariantsTab form={form} />
      </section>

      {/* 7. Shipping Section */}
      <section id="section-shipping" className="scroll-mt-24 space-y-5">
        <ShippingTab form={form} />
      </section>
    </ProductFormShell>
  );
}
