'use client';

import React from 'react';
import { ClipboardList } from 'lucide-react';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import {
  FieldGroup,
  ToggleField,
  TextField,
  TextAreaField,
} from '@/features/settings/components/SettingsFields';
import { useStoreSettingsForm } from '@/features/settings/hooks/useStoreSettingsForm';

export default function OrderSettingsPage() {
  const { form, setField, handleSave, isLoading, isSaving } = useStoreSettingsForm(
    (store) => ({
      orderNumberPrefix: store.orderNumberPrefix || 'ORD-',
      autoConfirmOrders: store.autoConfirmOrders ?? true,
      invoiceFooterNote: store.invoiceFooterNote || '',
    }),
    'Order settings saved.',
  );

  return (
    <SettingsPageShell
      icon={ClipboardList}
      iconBgColor="bg-emerald-50"
      iconColor="text-emerald-600"
      title="Order Settings"
      description="Configure order numbering, confirmation behaviour and invoice presentation."
      onSave={handleSave}
      isLoading={isLoading}
      isSaving={isSaving}
    >
      {form && (
        <>
          <FieldGroup title="Order Numbering" description="Applied to newly created orders.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Order number prefix"
                value={form.orderNumberPrefix || ''}
                onChange={(v) => setField('orderNumberPrefix', v)}
                placeholder="ORD-"
                helper="Example: a prefix of “ORD-” produces order numbers like ORD-482913."
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Processing" description="How incoming orders are handled.">
            <ToggleField
              label="Auto-confirm new orders"
              description="New orders move straight to Confirmed instead of waiting in Pending for manual review."
              checked={!!form.autoConfirmOrders}
              onChange={(v) => setField('autoConfirmOrders', v)}
            />
          </FieldGroup>

          <FieldGroup title="Invoices" description="Shown at the bottom of printed and downloaded invoices.">
            <TextAreaField
              label="Invoice footer note"
              value={form.invoiceFooterNote || ''}
              onChange={(v) => setField('invoiceFooterNote', v)}
              rows={3}
              placeholder="Thank you for shopping with us! For any questions, call 01700000000."
              helper="Leave blank to print invoices without a footer note."
            />
          </FieldGroup>
        </>
      )}
    </SettingsPageShell>
  );
}
