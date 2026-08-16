'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import { FieldGroup, ToggleField, TextAreaField } from '@/features/settings/components/SettingsFields';
import { useStoreSettingsForm } from '@/features/settings/hooks/useStoreSettingsForm';

export default function StorePreferencesPage() {
  const { form, setField, handleSave, isLoading, isSaving } = useStoreSettingsForm(
    (store) => ({
      maintenanceMode: store.maintenanceMode ?? false,
      maintenanceMessage: store.maintenanceMessage || '',
      catalogModeEnabled: store.catalogModeEnabled ?? false,
      showOutOfStockProducts: store.showOutOfStockProducts ?? true,
    }),
    'Store preferences saved.',
  );

  return (
    <SettingsPageShell
      icon={Settings}
      iconBgColor="bg-amber-50"
      iconColor="text-amber-500"
      title="Store Preferences"
      description="Control store-wide behaviour such as maintenance mode, catalog browsing and stock visibility."
      onSave={handleSave}
      isLoading={isLoading}
      isSaving={isSaving}
    >
      {form && (
        <>
          <FieldGroup
            title="Availability"
            description="Take your storefront offline temporarily without deleting anything."
          >
            <ToggleField
              label="Maintenance mode"
              description="Visitors see a maintenance notice instead of your storefront. Your dashboard stays fully accessible."
              checked={!!form.maintenanceMode}
              onChange={(v) => setField('maintenanceMode', v)}
            />

            {form.maintenanceMode && (
              <TextAreaField
                label="Maintenance message"
                value={form.maintenanceMessage || ''}
                onChange={(v) => setField('maintenanceMessage', v)}
                rows={3}
                placeholder="We're upgrading our store and will be back shortly. Thanks for your patience!"
                helper="Shown to visitors while maintenance mode is on."
              />
            )}
          </FieldGroup>

          <FieldGroup
            title="Browsing & Catalog"
            description="Change how customers can interact with your products."
          >
            <ToggleField
              label="Catalog mode"
              description="Show prices but hide add-to-cart and checkout. Useful for wholesale or enquiry-only stores."
              checked={!!form.catalogModeEnabled}
              onChange={(v) => setField('catalogModeEnabled', v)}
            />
            <ToggleField
              label="Show out-of-stock products"
              description="Keep sold-out products visible in listings instead of hiding them entirely."
              checked={!!form.showOutOfStockProducts}
              onChange={(v) => setField('showOutOfStockProducts', v)}
            />
          </FieldGroup>
        </>
      )}
    </SettingsPageShell>
  );
}
