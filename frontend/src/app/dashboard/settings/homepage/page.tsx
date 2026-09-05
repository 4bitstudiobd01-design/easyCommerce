'use client';

import React from 'react';
import { Home } from 'lucide-react';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import { FieldGroup, ToggleField } from '@/features/settings/components/SettingsFields';
import { useStoreSettingsForm } from '@/features/settings/hooks/useStoreSettingsForm';

export default function HomepageSettingsPage() {
  const { form, setField, handleSave, isLoading, isSaving } = useStoreSettingsForm(
    (store) => ({
      showHeroSection: store.showHeroSection ?? true,
      showCategoriesSection: store.showCategoriesSection ?? true,
      showFeaturedProducts: store.showFeaturedProducts ?? true,
      showNewArrivals: store.showNewArrivals ?? true,
      showBestSellers: store.showBestSellers ?? true,
      showFullCatalog: store.showFullCatalog ?? true,
      showPromoBanner: store.showPromoBanner ?? true,
      showWhyChooseUs: store.showWhyChooseUs ?? true,
    }),
    'Homepage settings saved.',
  );

  return (
    <SettingsPageShell
      icon={Home}
      iconBgColor="bg-amber-50"
      iconColor="text-amber-500"
      title="Homepage Settings"
      description="Choose which sections appear on your storefront homepage."
      onSave={handleSave}
      isLoading={isLoading}
      isSaving={isSaving}
    >
      {form && (
        <FieldGroup
          title="Homepage Sections"
          description="Toggle sections on or off. Hidden sections are removed from the storefront entirely."
        >
          <ToggleField
            label="Hero banner"
            description="The large banner carousel at the top of your homepage. Manage slides in Theme & Branding."
            checked={!!form.showHeroSection}
            onChange={(v) => setField('showHeroSection', v)}
          />
          <ToggleField
            label="Categories"
            description="Quick links to your product categories."
            checked={!!form.showCategoriesSection}
            onChange={(v) => setField('showCategoriesSection', v)}
          />
          <ToggleField
            label="Featured Products"
            description='A curated row of hand-picked products. Tag products as "Featured" in Catalog to fill it.'
            checked={!!form.showFeaturedProducts}
            onChange={(v) => setField('showFeaturedProducts', v)}
          />
          <ToggleField
            label="New Arrivals"
            description='A curated row of your newest products. Tag products as "New Arrivals" in Catalog to fill it.'
            checked={!!form.showNewArrivals}
            onChange={(v) => setField('showNewArrivals', v)}
          />
          <ToggleField
            label="Best Sellers"
            description='A curated row of top-performing products. Tag products as "Best Sellers" in Catalog to fill it.'
            checked={!!form.showBestSellers}
            onChange={(v) => setField('showBestSellers', v)}
          />
          <ToggleField
            label="Full Catalog"
            description="A grid of every published product in your store."
            checked={!!form.showFullCatalog}
            onChange={(v) => setField('showFullCatalog', v)}
          />
          <ToggleField
            label="Promo Banner"
            description="The promotional banner shown below the product sections."
            checked={!!form.showPromoBanner}
            onChange={(v) => setField('showPromoBanner', v)}
          />
          <ToggleField
            label="Why Choose Us"
            description="Trust badges highlighting delivery, security and quality."
            checked={!!form.showWhyChooseUs}
            onChange={(v) => setField('showWhyChooseUs', v)}
          />
        </FieldGroup>
      )}
    </SettingsPageShell>
  );
}
