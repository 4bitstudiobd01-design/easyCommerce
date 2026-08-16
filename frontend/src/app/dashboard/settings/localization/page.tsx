'use client';

import React from 'react';
import { Globe2 } from 'lucide-react';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import { FieldGroup, SelectField } from '@/features/settings/components/SettingsFields';
import { useStoreSettingsForm } from '@/features/settings/hooks/useStoreSettingsForm';

const CURRENCIES = [
  { value: 'BDT', label: '৳ Bangladeshi Taka (BDT)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা (Bangla)' },
];

const TIMEZONES = [
  { value: 'Asia/Dhaka', label: '(GMT+6) Asia/Dhaka' },
  { value: 'Asia/Kolkata', label: '(GMT+5:30) Asia/Kolkata' },
  { value: 'Asia/Dubai', label: '(GMT+4) Asia/Dubai' },
  { value: 'Europe/London', label: '(GMT+0) Europe/London' },
  { value: 'America/New_York', label: '(GMT-5) America/New_York' },
  { value: 'UTC', label: '(GMT+0) UTC' },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY — 31/12/2026' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY — 12/31/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD — 2026-12-31' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY — 31 Dec 2026' },
];

const WEIGHT_UNITS = [
  { value: 'KG', label: 'Kilogram (kg)' },
  { value: 'G', label: 'Gram (g)' },
  { value: 'LB', label: 'Pound (lb)' },
];

export default function LocalizationSettingsPage() {
  const { form, setField, handleSave, isLoading, isSaving } = useStoreSettingsForm(
    (store) => ({
      currency: store.currency || 'BDT',
      language: store.language || 'en',
      timezone: store.timezone || 'Asia/Dhaka',
      dateFormat: store.dateFormat || 'DD/MM/YYYY',
      weightUnit: store.weightUnit || 'KG',
    }),
    'Localization settings saved.',
  );

  return (
    <SettingsPageShell
      icon={Globe2}
      iconBgColor="bg-emerald-50"
      iconColor="text-emerald-600"
      title="Localization"
      description="Set your store language, currency, timezone, date format and units of measure."
      onSave={handleSave}
      isLoading={isLoading}
      isSaving={isSaving}
    >
      {form && (
        <>
          <FieldGroup
            title="Currency & Language"
            description="Currency controls how prices are displayed across your storefront and invoices."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Store Currency"
                value={form.currency || 'BDT'}
                onChange={(v) => setField('currency', v)}
                options={CURRENCIES}
              />
              <SelectField
                label="Store Language"
                value={form.language || 'en'}
                onChange={(v) => setField('language', v)}
                options={LANGUAGES}
              />
            </div>
          </FieldGroup>

          <FieldGroup
            title="Time & Formatting"
            description="Applied to order timestamps, reports and analytics date ranges."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Timezone"
                value={form.timezone || 'Asia/Dhaka'}
                onChange={(v) => setField('timezone', v)}
                options={TIMEZONES}
              />
              <SelectField
                label="Date Format"
                value={form.dateFormat || 'DD/MM/YYYY'}
                onChange={(v) => setField('dateFormat', v)}
                options={DATE_FORMATS}
              />
            </div>
          </FieldGroup>

          <FieldGroup
            title="Units"
            description="Default unit used for product weights and shipping calculations."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Weight Unit"
                value={form.weightUnit || 'KG'}
                onChange={(v) => setField('weightUnit', v)}
                options={WEIGHT_UNITS}
              />
            </div>
          </FieldGroup>
        </>
      )}
    </SettingsPageShell>
  );
}
