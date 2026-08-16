'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import { FieldGroup, ToggleField, TextField } from '@/features/settings/components/SettingsFields';
import { useStoreSettingsForm } from '@/features/settings/hooks/useStoreSettingsForm';

export default function CheckoutSettingsPage() {
  const { store, form, setField, handleSave, isLoading, isSaving } = useStoreSettingsForm(
    (s) => ({
      guestCheckoutEnabled: s.guestCheckoutEnabled ?? true,
      requireCustomerEmail: s.requireCustomerEmail ?? false,
      showCouponFieldAtCheckout: s.showCouponFieldAtCheckout ?? true,
      showOrderNoteFieldAtCheckout: s.showOrderNoteFieldAtCheckout ?? true,
      minimumOrderAmount: s.minimumOrderAmount ?? 0,
    }),
    'Checkout settings saved.',
  );

  const currency = store?.currency || 'BDT';

  return (
    <SettingsPageShell
      icon={ShoppingCart}
      iconBgColor="bg-purple-50"
      iconColor="text-purple-600"
      title="Checkout Settings"
      description="Manage the checkout flow, which fields customers see, and minimum order rules."
      onSave={handleSave}
      isLoading={isLoading}
      isSaving={isSaving}
    >
      {form && (
        <>
          <FieldGroup title="Checkout Flow" description="Who can place an order and what they must provide.">
            <ToggleField
              label="Allow guest checkout"
              description="Customers can complete an order without creating an account."
              checked={!!form.guestCheckoutEnabled}
              onChange={(v) => setField('guestCheckoutEnabled', v)}
            />
            <ToggleField
              label="Require email address"
              description="Make the email field mandatory at checkout. Phone number is always required."
              checked={!!form.requireCustomerEmail}
              onChange={(v) => setField('requireCustomerEmail', v)}
            />
          </FieldGroup>

          <FieldGroup title="Checkout Fields" description="Optional fields shown on the checkout form.">
            <ToggleField
              label="Show coupon code field"
              description="Let customers apply promo codes during checkout."
              checked={!!form.showCouponFieldAtCheckout}
              onChange={(v) => setField('showCouponFieldAtCheckout', v)}
            />
            <ToggleField
              label="Show order note field"
              description="Give customers a place to add delivery instructions or special requests."
              checked={!!form.showOrderNoteFieldAtCheckout}
              onChange={(v) => setField('showOrderNoteFieldAtCheckout', v)}
            />
          </FieldGroup>

          <FieldGroup title="Order Rules" description="Guardrails applied before an order can be placed.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label={`Minimum order amount (${currency})`}
                type="number"
                min={0}
                value={form.minimumOrderAmount ?? 0}
                onChange={(v) => setField('minimumOrderAmount', Number(v) || 0)}
                helper="Set to 0 to allow orders of any value."
              />
            </div>
          </FieldGroup>
        </>
      )}
    </SettingsPageShell>
  );
}
