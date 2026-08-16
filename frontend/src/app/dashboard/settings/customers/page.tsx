'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import { FieldGroup, ToggleField } from '@/features/settings/components/SettingsFields';
import { useStoreSettingsForm } from '@/features/settings/hooks/useStoreSettingsForm';

export default function CustomerSettingsPage() {
  const { form, setField, handleSave, isLoading, isSaving } = useStoreSettingsForm(
    (store) => ({
      allowCustomerRegistration: store.allowCustomerRegistration ?? true,
      requireEmailVerification: store.requireEmailVerification ?? false,
      allowCustomerReviews: store.allowCustomerReviews ?? true,
      autoApproveReviews: store.autoApproveReviews ?? true,
    }),
    'Customer settings saved.',
  );

  return (
    <SettingsPageShell
      icon={Users}
      iconBgColor="bg-blue-50"
      iconColor="text-blue-600"
      title="Customer Settings"
      description="Manage customer accounts, registration rules and product review moderation."
      onSave={handleSave}
      isLoading={isLoading}
      isSaving={isSaving}
    >
      {form && (
        <>
          <FieldGroup title="Accounts" description="How customers sign up and access their account.">
            <ToggleField
              label="Allow customer registration"
              description="Customers can create an account to track orders and save addresses."
              checked={!!form.allowCustomerRegistration}
              onChange={(v) => setField('allowCustomerRegistration', v)}
            />
            <ToggleField
              label="Require email verification"
              description="New accounts must confirm their email address before they can place an order."
              checked={!!form.requireEmailVerification}
              onChange={(v) => setField('requireEmailVerification', v)}
              disabled={!form.allowCustomerRegistration}
            />
          </FieldGroup>

          <FieldGroup title="Reviews" description="Control product reviews left by your customers.">
            <ToggleField
              label="Allow product reviews"
              description="Customers can rate and review products they have purchased."
              checked={!!form.allowCustomerReviews}
              onChange={(v) => setField('allowCustomerReviews', v)}
            />
            <ToggleField
              label="Auto-approve reviews"
              description="Publish new reviews immediately. Turn off to moderate each review before it appears."
              checked={!!form.autoApproveReviews}
              onChange={(v) => setField('autoApproveReviews', v)}
              disabled={!form.allowCustomerReviews}
            />
          </FieldGroup>
        </>
      )}
    </SettingsPageShell>
  );
}
