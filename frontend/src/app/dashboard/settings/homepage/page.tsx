'use client';

import React from 'react';
import { Home } from 'lucide-react';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import { FieldGroup, ToggleField, TextField } from '@/features/settings/components/SettingsFields';
import { useStoreSettingsForm } from '@/features/settings/hooks/useStoreSettingsForm';

export default function HomepageSettingsPage() {
  const { form, setField, handleSave, isLoading, isSaving } = useStoreSettingsForm(
    (store) => ({
      showHeroSection: store.showHeroSection ?? true,
      showFeaturedProducts: store.showFeaturedProducts ?? true,
      showCategoriesSection: store.showCategoriesSection ?? true,
      featuredProductsCount: store.featuredProductsCount ?? 8,
    }),
    'Homepage settings saved.',
  );

  return (
    <SettingsPageShell
      icon={Home}
      iconBgColor="bg-amber-50"
      iconColor="text-amber-500"
      title="Homepage Settings"
      description="Choose which sections appear on your storefront homepage and how much they show."
      onSave={handleSave}
      isLoading={isLoading}
      isSaving={isSaving}
    >
      {form && (
        <>
          <FieldGroup
            title="Homepage Sections"
            description="Toggle sections on or off. Hidden sections are removed from the storefront entirely."
          >
            <ToggleField
              label="Hero banner section"
              description="The large banner carousel at the top of your homepage. Manage slides in Theme & Branding."
              checked={!!form.showHeroSection}
              onChange={(v) => setField('showHeroSection', v)}
            />
            <ToggleField
              label="Featured products section"
              description="A curated grid of products shown below the hero banner."
              checked={!!form.showFeaturedProducts}
              onChange={(v) => setField('showFeaturedProducts', v)}
            />
            <ToggleField
              label="Categories section"
              description="Quick links to your product categories."
              checked={!!form.showCategoriesSection}
              onChange={(v) => setField('showCategoriesSection', v)}
            />
          </FieldGroup>

          <FieldGroup title="Layout" description="Fine-tune how much content each section displays.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Featured products to show"
                type="number"
                min={1}
                value={form.featuredProductsCount ?? 8}
                onChange={(v) => setField('featuredProductsCount', Math.max(1, Number(v) || 1))}
                helper="Recommended: 4, 8 or 12 so the grid stays evenly filled."
              />
            </div>
          </FieldGroup>
        </>
      )}
    </SettingsPageShell>
  );
}
