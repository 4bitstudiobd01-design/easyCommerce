'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Store as StoreIcon,
  Link2,
  FileText,
  Truck,
  CreditCard,
  Globe,
  MessageSquare,
  Mail,
  ShieldBan,
  Sliders,
  Palette,
  Wallet,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  const shopCards = [
    {
      id: 'general',
      title: 'Shop Settings',
      description: "General shop configurations customize your shop's core settings for a seamless experience.",
      icon: StoreIcon,
      badge: null,
      iconColor: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'domain',
      title: 'Shop Domain',
      description: "Manage your shop's core configurations, including domain setup and general settings.",
      icon: Link2,
      badge: null,
      iconColor: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'theme',
      title: 'Theme & Branding',
      description: 'Customize primary accent colors, font typography, logo, favicon, and hero slider banners.',
      icon: Palette,
      badge: 'New',
      iconColor: 'text-pink-600 bg-pink-50',
    },
    {
      id: 'delivery',
      title: 'Delivery Support',
      description: 'Manage your shop delivery settings to ensure smooth and efficient order fulfillment.',
      icon: Truck,
      badge: null,
      iconColor: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'payment',
      title: 'Payment Gateway',
      description: 'Integrate and manage payment options to provide customers with secure and flexible transaction methods.',
      icon: CreditCard,
      badge: null,
      iconColor: 'text-emerald-600 bg-emerald-50',
    },
    {
      id: 'seo',
      title: 'SEO & Marketing Integrations',
      description: 'Enhance your shop visibility by Google Tag Manager, Facebook Pixel, TikTok Pixel, and SEO tools.',
      icon: Globe,
      badge: 'New',
      iconColor: 'text-purple-600 bg-purple-50',
    },
    {
      id: 'sms',
      title: 'SMS Support',
      description: 'Enable SMS notifications and support to keep your customers informed with real-time updates.',
      icon: MessageSquare,
      badge: null,
      iconColor: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'email',
      title: 'Email Gateway',
      description: 'Provide instant communication and transactional invoice assistance with SMTP & SendGrid.',
      icon: Mail,
      badge: null,
      iconColor: 'text-amber-600 bg-amber-50',
    },
    {
      id: 'policy',
      title: 'Shop Policy',
      description: 'Define and customize policies for your shop, including returns, refunds, and customer service guidelines.',
      icon: FileText,
      badge: null,
      iconColor: 'text-slate-700 bg-slate-100',
    },
    {
      id: 'blocklist',
      title: 'Blocklist',
      description: 'Block abusive visitors by IP address, IP range, device, country, phone, or email to stop fraud.',
      icon: ShieldBan,
      badge: 'New',
      iconColor: 'text-red-600 bg-red-50',
    },
    {
      id: 'limits',
      title: 'Order Limits',
      description: 'Limit repeat and duplicate orders, choose how they are handled, and review protected attempts.',
      icon: Sliders,
      badge: 'New',
      iconColor: 'text-indigo-600 bg-indigo-50',
    },
    {
      id: 'billing',
      title: 'Billing & Plan',
      description: 'View your current plan, usage limits, and upgrade for more stores and staff seats.',
      icon: Wallet,
      badge: 'New',
      iconColor: 'text-blue-600 bg-blue-50',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Shop</h1>
        <p className="text-xs text-slate-500 font-normal">
          Set up and customize your shop to ensure a smooth and efficient experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {shopCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              onClick={() => router.push(`/dashboard/settings/${card.id}`)}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-purple-400 transition-all cursor-pointer group flex flex-col justify-between space-y-4 relative"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl ${card.iconColor} shadow-sm group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {card.badge && (
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-[10px] rounded-full shadow-sm">
                      {card.badge}
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-purple-600 transition-colors">
                  {card.title}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
