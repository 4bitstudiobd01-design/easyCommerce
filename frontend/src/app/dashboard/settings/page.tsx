'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StoreSettingsHeader } from '@/features/settings/components/StoreSettingsHeader';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { SettingsCard } from '@/features/settings/components/SettingsCard';
import { SettingsInfoBox } from '@/features/settings/components/SettingsInfoBox';
import {
  Store, Globe, Globe2, Settings,
  Palette, LayoutTemplate, Home,
  ClipboardList, ShoppingCart, SlidersHorizontal, Users,
  Truck, MapPin, ShieldAlert,
  CreditCard, BarChart3,
  Mail, MessageSquare, Code2, Link,
  FileText, RefreshCw, Trash2
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="w-full space-y-12 pb-12">
        <StoreSettingsHeader />

        {/* TOP SECTIONS */}
        <div className="space-y-10">
          
          {/* General */}
          <SettingsSection 
            title="General" 
            subtitle="Basic information and preferences about your store."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SettingsCard
                icon={Store} iconBgColor="bg-purple-50" iconColor="text-purple-600"
                title="Store Information" description="Update your store name, email, contact number and address."
                onClick={() => router.push('/dashboard/settings/general')}
              />
              <SettingsCard
                icon={Globe} iconBgColor="bg-blue-50" iconColor="text-blue-600"
                title="Store Domain" description="Manage your store domain, subdomain and SSL settings."
                onClick={() => router.push('/dashboard/settings/domain')}
              />
              <SettingsCard
                icon={Globe2} iconBgColor="bg-emerald-50" iconColor="text-emerald-600"
                title="Localization" description="Set your store language, currency, timezone and date format."
                onClick={() => router.push('/dashboard/settings/localization')}
              />
              <SettingsCard
                icon={Settings} iconBgColor="bg-amber-50" iconColor="text-amber-500"
                title="Store Preferences" description="Configure general preferences and store-wide settings."
                onClick={() => router.push('/dashboard/settings/preferences')}
              />
            </div>
          </SettingsSection>

          {/* Storefront */}
          <SettingsSection 
            title="Storefront" 
            subtitle="Customize how your store looks and behaves."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SettingsCard
                icon={Palette} iconBgColor="bg-purple-50" iconColor="text-purple-600"
                title="Theme & Branding" description="Customize theme, colors, typography, logo and store branding."
                onClick={() => router.push('/dashboard/settings/theme')}
              />
              <SettingsCard
                icon={LayoutTemplate} iconBgColor="bg-blue-50" iconColor="text-blue-600"
                title="Navigation" description="Manage menu, header, footer and other navigation settings."
                onClick={() => router.push('/dashboard/settings/navigation')}
              />
              <SettingsCard
                icon={Home} iconBgColor="bg-amber-50" iconColor="text-amber-500"
                title="Homepage Settings" description="Configure homepage layout, sections and content settings."
                onClick={() => router.push('/dashboard/settings/homepage')}
              />
            </div>
          </SettingsSection>

          {/* Orders & Checkout */}
          <SettingsSection 
            title="Orders & Checkout" 
            subtitle="Manage order processing and checkout experience."
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
                icon={SlidersHorizontal} iconBgColor="bg-amber-50" iconColor="text-amber-500"
                title="Order Limits" description="Set limits for minimum order, max order, cancellation and return."
                onClick={() => router.push('/dashboard/settings/limits')}
              />
              <SettingsCard
                icon={Users} iconBgColor="bg-blue-50" iconColor="text-blue-600"
                title="Customer Settings" description="Manage customer registration, accounts and login preferences."
                onClick={() => router.push('/dashboard/settings/customers')}
              />
            </div>
          </SettingsSection>

        </div>

        {/* BOTTOM MASONRY GRID (4 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 pt-4">
          
          {/* Column 1: Shipping & Security */}
          <div className="flex flex-col gap-8">
            <SettingsSection title="Shipping" subtitle="Manage shipping preferences.">
              <SettingsCard
                icon={Truck} iconBgColor="bg-blue-50" iconColor="text-blue-600"
                title="Shipping Settings" description="Configure shipping methods, rates and default options."
                onClick={() => router.push('/dashboard/settings/delivery')}
              />
              <SettingsCard
                icon={MapPin} iconBgColor="bg-blue-50" iconColor="text-blue-600"
                title="Delivery Zones" description="Create and manage delivery zones for your store."
                onClick={() => router.push('/dashboard/settings/delivery-zones')}
              />
            </SettingsSection>
            
            <SettingsSection title="Security" subtitle="Keep your store secure.">
              <SettingsCard
                icon={ShieldAlert} iconBgColor="bg-red-50" iconColor="text-red-500"
                title="Blocklist" description="Block abusive visitors and prevent fraud activities."
                onClick={() => router.push('/dashboard/settings/blocklist')}
              />
            </SettingsSection>
          </div>

          {/* Column 2: Payments & SEO */}
          <div className="flex flex-col gap-8">
            <SettingsSection title="Payments" subtitle="Manage payment preferences.">
              <SettingsCard
                icon={CreditCard} iconBgColor="bg-emerald-50" iconColor="text-emerald-600"
                title="Payment Preferences" description="Configure COD, partial payment, tips and other payment preferences."
                onClick={() => router.push('/dashboard/settings/payment')}
              />
              <SettingsInfoBox text={
                <>Manage payment gateways from the <span className="font-bold text-blue-700">Payments &rarr; Gateways</span> section.</>
              } />
            </SettingsSection>

            <SettingsSection title="SEO & Tracking" subtitle="Improve your store visibility.">
              <SettingsCard
                icon={BarChart3} iconBgColor="bg-purple-50" iconColor="text-purple-600"
                title="Tracking Preferences" description="Manage SEO, meta data and tracking preferences."
                onClick={() => router.push('/dashboard/settings/seo')}
              />
              <SettingsInfoBox text={
                <>Manage pixels & integrations from the <span className="font-bold text-blue-700">Marketing &rarr; Pixels</span> section.</>
              } />
            </SettingsSection>
          </div>

          {/* Column 3: Notifications & Advanced */}
          <div className="flex flex-col gap-8">
            <SettingsSection title="Notifications" subtitle="Manage communication settings.">
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
            </SettingsSection>

            <SettingsSection title="Advanced" subtitle="For advanced users and developers.">
              <SettingsCard
                icon={Code2} iconBgColor="bg-blue-50" iconColor="text-blue-600"
                title="API / Developer" description="Manage API keys, webhooks and advanced developer settings."
                onClick={() => router.push('/dashboard/settings/developer')}
              />
              <SettingsCard
                icon={Link} iconBgColor="bg-purple-50" iconColor="text-purple-600"
                title="Webhooks" description="Configure and manage webhook events for your store."
                onClick={() => router.push('/dashboard/settings/webhooks')}
              />
            </SettingsSection>
          </div>

          {/* Column 4: Policies & Danger Zone */}
          <div className="flex flex-col gap-8">
            <SettingsSection title="Policies" subtitle="Manage your store policies and terms.">
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
            </SettingsSection>

            <SettingsSection title="Danger Zone" subtitle="Irreversible and destructive actions." titleColor="text-red-600">
              <SettingsCard
                danger
                icon={Trash2} iconBgColor="bg-red-50" iconColor="text-red-500"
                title="Delete Store" description="Permanently delete your store and all associated data."
                onClick={() => router.push('/dashboard/settings/delete-store')}
              />
            </SettingsSection>
          </div>

        </div>
      </div>
    </div>
  );
}
