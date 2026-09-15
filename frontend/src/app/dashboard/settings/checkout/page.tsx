'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import { FieldGroup, ToggleField, TextField } from '@/features/settings/components/SettingsFields';
import { useStoreSettingsForm } from '@/features/settings/hooks/useStoreSettingsForm';
import type { CheckoutFieldConfig, CheckoutFieldKey } from '@/features/tenant/api/tenantApi';

const DEFAULT_FIELD_CONFIG: CheckoutFieldConfig = {
  email: { show: true, required: false },
  address: { show: true, required: true },
  country: { show: true, required: true },
  division: { show: true, required: true },
  district: { show: true, required: true },
  cityArea: { show: true, required: true },
  zipCode: { show: true, required: false },
  orderNote: { show: true, required: false },
};

const FIELD_LABELS: Record<CheckoutFieldKey, string> = {
  email: 'Email address',
  address: 'Street address',
  country: 'Country',
  division: 'Division',
  district: 'District',
  cityArea: 'City / Area',
  zipCode: 'Zip code',
  orderNote: 'Order note',
};

const FIELD_ORDER: CheckoutFieldKey[] = [
  'email',
  'address',
  'country',
  'division',
  'district',
  'cityArea',
  'zipCode',
  'orderNote',
];

export default function CheckoutSettingsPage() {
  const { store, form, setField, handleSave, isLoading, isSaving } = useStoreSettingsForm(
    (s) => ({
      guestCheckoutEnabled: s.guestCheckoutEnabled ?? true,
      requireCustomerEmail: s.requireCustomerEmail ?? false,
      showCouponFieldAtCheckout: s.showCouponFieldAtCheckout ?? true,
      showOrderNoteFieldAtCheckout: s.showOrderNoteFieldAtCheckout ?? true,
      minimumOrderAmount: Number(s.minimumOrderAmount ?? 0),
      // Numeric columns arrive as strings in JSON ("60.00"); coerce so the
      // update payload sends real numbers the backend's @IsNumber accepts.
      deliveryChargeInsideDhaka: Number(s.deliveryChargeInsideDhaka ?? 60),
      deliveryChargeOutsideDhaka: Number(s.deliveryChargeOutsideDhaka ?? 120),
      checkoutFieldConfig: { ...DEFAULT_FIELD_CONFIG, ...(s.checkoutFieldConfig ?? {}) } as CheckoutFieldConfig,
    }),
    'Checkout settings saved.',
  );

  const currency = store?.currency || 'BDT';

  const fieldConfig = (form?.checkoutFieldConfig ?? DEFAULT_FIELD_CONFIG) as CheckoutFieldConfig;

  const updateFieldRule = (key: CheckoutFieldKey, patch: Partial<{ show: boolean; required: boolean }>) => {
    const current = fieldConfig[key] ?? DEFAULT_FIELD_CONFIG[key];
    const next: CheckoutFieldConfig = {
      ...fieldConfig,
      [key]: { ...current, ...patch },
    };
    // Hiding a field makes "required" meaningless — clear it too.
    if (patch.show === false) next[key].required = false;
    setField('checkoutFieldConfig', next);
  };

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
          </FieldGroup>

          <FieldGroup title="Checkout Fields" description="Optional fields shown on the checkout form.">
            <ToggleField
              label="Show coupon code field"
              description="Let customers apply promo codes during checkout."
              checked={!!form.showCouponFieldAtCheckout}
              onChange={(v) => setField('showCouponFieldAtCheckout', v)}
            />
          </FieldGroup>

          <FieldGroup
            title="Shipping Form Fields"
            description="Choose which fields appear on the checkout form and which are mandatory. Full Name and Phone Number are always shown and required — a delivery can't happen without them."
          >
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <span>Field</span>
                <span className="w-16 text-center">Show</span>
                <span className="w-16 text-center">Required</span>
              </div>

              {/* Always-on fields — a delivery can't happen without them, so both toggles are locked. */}
              {(['Full Name', 'Phone Number'] as const).map((label) => (
                <div key={label} className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 items-center bg-slate-50/40">
                  <span className="text-xs font-semibold text-slate-800">
                    {label}
                    <span className="ml-1.5 text-[10px] font-bold text-slate-400 uppercase">Always</span>
                  </span>
                  <label className="w-16 flex justify-center cursor-not-allowed">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 opacity-60"
                      checked
                      disabled
                      readOnly
                    />
                  </label>
                  <label className="w-16 flex justify-center cursor-not-allowed">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 opacity-60"
                      checked
                      disabled
                      readOnly
                    />
                  </label>
                </div>
              ))}

              {FIELD_ORDER.map((key) => {
                const rule = fieldConfig[key] ?? DEFAULT_FIELD_CONFIG[key];
                return (
                  <div key={key} className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 items-center">
                    <span className="text-xs font-semibold text-slate-800">{FIELD_LABELS[key]}</span>
                    <label className="w-16 flex justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        checked={rule.show}
                        onChange={(e) => updateFieldRule(key, { show: e.target.checked })}
                      />
                    </label>
                    <label
                      className={`w-16 flex justify-center ${rule.show ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        checked={rule.required}
                        disabled={!rule.show}
                        onChange={(e) => updateFieldRule(key, { required: e.target.checked })}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
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

          <FieldGroup
            title="Delivery Charges"
            description="Shown as the two shipping options at checkout — customers pick their zone."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label={`Inside Dhaka (${currency})`}
                type="number"
                min={0}
                value={form.deliveryChargeInsideDhaka ?? 60}
                onChange={(v) => setField('deliveryChargeInsideDhaka', Number(v) || 0)}
                helper="Flat charge for orders delivered within Dhaka."
              />
              <TextField
                label={`Outside Dhaka (${currency})`}
                type="number"
                min={0}
                value={form.deliveryChargeOutsideDhaka ?? 120}
                onChange={(v) => setField('deliveryChargeOutsideDhaka', Number(v) || 0)}
                helper="Flat charge for orders delivered outside Dhaka."
              />
            </div>
          </FieldGroup>
        </>
      )}
    </SettingsPageShell>
  );
}
