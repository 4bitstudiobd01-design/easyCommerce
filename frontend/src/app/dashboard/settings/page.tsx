'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StoreSettingsHeader } from '@/features/settings/components/StoreSettingsHeader';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsCard } from '@/features/settings/components/SettingsCard';
import {
  Globe,
  Palette, Home,
  ClipboardList, ShoppingCart, Users, CreditCard,
  MapPin, ShieldAlert,
  Mail, MessageSquare,
  FileText, RefreshCw, Trash2
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="w-full space-y-10 pb-12">
        <StoreSettingsHeader />

        {/* General */}
        <SettingsSection
          title="General"
          subtitle="Basic information and preferences about your store."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SettingsCard
              icon={Globe} iconBgColor="bg-blue-50" iconColor="text-blue-600"
              title="Store Domain" description="Manage your store domain, subdomain and SSL settings."
              onClick={() => router.push('/dashboard/settings/domain')}
            />
          </div>
        </SettingsSection>

        {/* Storefront */}
        <SettingsSection
          title="Storefront"
          subtitle="Customize how your store looks and behaves."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SettingsCard
              icon={Palette} iconBgColor="bg-purple-50" iconColor="text-purple-600"
              title="Theme & Branding" description="Store name, contact info, logo, colors, typography and branding."
              onClick={() => router.push('/dashboard/settings/theme')}
            />
            <SettingsCard
              icon={Home} iconBgColor="bg-amber-50" iconColor="text-amber-500"
              title="Homepage Settings" description="Configure homepage layout, sections and content settings."
              onClick={() => router.push('/dashboard/settings/homepage')}
            />
          </div>
        </SettingsSection>

        {/* Sales & Orders */}
        <SettingsSection
          title="Sales & Orders"
          subtitle="Manage order processing, checkout and payment collection."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SettingsCard
              icon={ClipboardList} iconBgColor="bg-emerald-50" iconColor="text-emerald-600"
              title="Order Settings" description="Configure order status, invoice, packing slip and other settings."
              onClick={() => router.push('/dashboard/settings/orders')}
            />
            <SettingsCard
              icon={ShoppingCart} iconBgColor="bg-purple-50" iconColor="text-purple-600"
              title="Checkout Settings" description="Manage checkout flow, guest checkout, fields and advanced options."
              onClick={() => router.push('/dashboard/settings/checkout')}
            />
            <SettingsCard
              icon={Users} iconBgColor="bg-blue-50" iconColor="text-blue-600"
              title="Customer Settings" description="Manage customer registration, accounts and login preferences."
              onClick={() => router.push('/dashboard/settings/customers')}
            />
          </div>
        </SettingsSection>

        {/* Shipping */}
        <SettingsSection title="Shipping" subtitle="Manage shipping preferences.">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SettingsCard
              icon={MapPin} iconBgColor="bg-blue-50" iconColor="text-blue-600"
              title="Delivery Zones" description="Create and manage delivery zones for your store."
              onClick={() => router.push('/dashboard/settings/delivery-zones')}
            />
          </div>
        </SettingsSection>

        {/* Billing */}
        <SettingsSection title="Billing" subtitle="Manage your subscription and plan.">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SettingsCard
              icon={CreditCard} iconBgColor="bg-amber-50" iconColor="text-amber-500"
              title="Billing & Subscription" description="View your current plan, usage and manage payment methods."
              onClick={() => router.push('/dashboard/settings/billing')}
            />
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" subtitle="Manage communication settings.">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SettingsCard
              icon={Mail} iconBgColor="bg-purple-50" iconColor="text-purple-600"
              title="Email Notifications" description="Manage email templates and notification preferences."
              onClick={() => router.push('/dashboard/settings/email')}
            />
            <SettingsCard
              icon={MessageSquare} iconBgColor="bg-blue-50" iconColor="text-blue-600"
              title="SMS Notifications" description="Manage SMS templates and notification preferences."
              onClick={() => router.push('/dashboard/settings/sms')}
            />
          </div>
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Security" subtitle="Keep your store secure.">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SettingsCard
              icon={ShieldAlert} iconBgColor="bg-red-50" iconColor="text-red-500"
              title="Blocklist" description="Block abusive visitors and prevent fraud activities."
              onClick={() => router.push('/dashboard/settings/blocklist')}
            />
          </div>
        </SettingsSection>

        {/* Policies */}
        <SettingsSection title="Policies" subtitle="Manage your store policies and terms.">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SettingsCard
              icon={FileText} iconBgColor="bg-blue-50" iconColor="text-blue-600"
              title="Store Policies" description="Create and manage your store policies."
              onClick={() => router.push('/dashboard/settings/policy')}
            />
            <SettingsCard
              icon={RefreshCw} iconBgColor="bg-emerald-50" iconColor="text-emerald-600"
              title="Return & Refund Policy" description="Manage return, refund and cancellation policies."
              onClick={() => router.push('/dashboard/settings/policy')}
            />
            <SettingsCard
              icon={FileText} iconBgColor="bg-amber-50" iconColor="text-amber-500"
              title="Terms & Conditions" description="Set terms and conditions for using your store."
              onClick={() => router.push('/dashboard/settings/policy')}
            />
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Danger Zone" subtitle="Irreversible and destructive actions." titleColor="text-red-600">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SettingsCard
              danger
              icon={Trash2} iconBgColor="bg-red-50" iconColor="text-red-500"
              title="Delete Store" description="Permanently delete your store and all associated data."
              onClick={() => router.push('/dashboard/settings/delete-store')}
            />
          </div>
        </SettingsSection>

      </div>
    </div>
  );
}
