'use client';

import React, { useState } from 'react';
import {
  Store,
  Globe,
  Shield,
  Users,
  Package,
  Layers,
  Download,
  ShoppingBag,
  FileDown,
  Tag,
  Mail,
  Check,
  Scale,
  DollarSign,
  Calendar,
  Plus,
  ShieldCheck,
  History,
  ToggleLeft,
  ToggleRight,
  Clock,
  User,
  Sparkles,
} from 'lucide-react';
import { PlanRecord } from '../types';
import { toast } from 'sonner';

interface PlanDetailsTabsProps {
  plan: PlanRecord;
  onOpenComparePlans: () => void;
  onPlanChange?: (updated: Partial<PlanRecord>) => void;
}

export function PlanDetailsTabs({
  plan,
  onOpenComparePlans,
  onPlanChange,
}: PlanDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<
    'features' | 'pricing' | 'trial' | 'addons' | 'permissions' | 'history'
  >('features');

  // Interactive states for other tabs
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [trialDays, setTrialDays] = useState(plan.trialDays || 14);
  const [requireCreditCard, setRequireCreditCard] = useState(false);
  const [gateways, setGateways] = useState({
    bkash: true,
    nagad: true,
    sslcommerz: true,
    stripe: true,
    cod: true,
  });

  const renderFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'store':
        return <Store className="w-3.5 h-3.5 text-slate-600" />;
      case 'globe':
        return <Globe className="w-3.5 h-3.5 text-slate-600" />;
      case 'shield':
      case 'lock':
        return <Shield className="w-3.5 h-3.5 text-slate-600" />;
      case 'users':
        return <Users className="w-3.5 h-3.5 text-slate-600" />;
      case 'package':
        return <Package className="w-3.5 h-3.5 text-slate-600" />;
      case 'layers':
        return <Layers className="w-3.5 h-3.5 text-slate-600" />;
      case 'download':
        return <Download className="w-3.5 h-3.5 text-slate-600" />;
      case 'shopping-bag':
        return <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />;
      case 'file-down':
        return <FileDown className="w-3.5 h-3.5 text-slate-600" />;
      case 'tag':
        return <Tag className="w-3.5 h-3.5 text-slate-600" />;
      case 'mail':
        return <Mail className="w-3.5 h-3.5 text-slate-600" />;
      default:
        return <Check className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const categories = plan.featureCategories || [
    {
      category: 'Core',
      items: [
        {
          id: 'f-store',
          name: 'Online Store',
          iconName: 'store' as const,
          included: true,
          details: 'Create and manage your online store',
        },
        {
          id: 'f-domain',
          name: 'Custom Domain',
          iconName: 'globe' as const,
          included: true,
          details: 'Connect your own domain',
        },
        {
          id: 'f-ssl',
          name: 'SSL Certificate',
          iconName: 'shield' as const,
          included: true,
          details: 'Free SSL certificate for your domain',
        },
        {
          id: 'f-staff',
          name: 'Staff Accounts',
          iconName: 'users' as const,
          included: 10,
          details: 'Number of staff accounts you can add',
        },
      ],
    },
    {
      category: 'Products',
      items: [
        {
          id: 'f-prod-limit',
          name: 'Product Limit',
          iconName: 'package' as const,
          included: '10,000',
          details: 'Total number of products',
        },
        {
          id: 'f-prod-variants',
          name: 'Product Variants',
          iconName: 'layers' as const,
          included: 'Unlimited',
          details: 'Unlimited variants for each product',
        },
        {
          id: 'f-digital-prod',
          name: 'Digital Products',
          iconName: 'download' as const,
          included: true,
          details: 'Sell digital products and downloads',
        },
      ],
    },
    {
      category: 'Orders',
      items: [
        {
          id: 'f-orders-limit',
          name: 'Monthly Orders Limit',
          iconName: 'shopping-bag' as const,
          included: '2,000',
          details: 'Maximum orders per month',
        },
        {
          id: 'f-order-export',
          name: 'Order Export',
          iconName: 'file-down' as const,
          included: true,
          details: 'Export orders in CSV format',
        },
      ],
    },
    {
      category: 'Marketing',
      items: [
        {
          id: 'f-discounts',
          name: 'Discounts & Coupons',
          iconName: 'tag' as const,
          included: true,
          details: 'Create discount coupons and offers',
        },
        {
          id: 'f-email',
          name: 'Email Marketing',
          iconName: 'mail' as const,
          included: '10,000 / month',
          details: 'Monthly email send limit',
        },
      ],
    },
  ];

  const whatsIncludedList = plan.whatsIncluded || [
    'Everything in Starter Plan',
    'Advanced reports & analytics',
    'Abandoned cart recovery',
    'Priority email & chat support',
    'Advanced discount rules',
    'POS access',
    'API access',
    'Multiple store locations',
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Tab Navigation Header */}
      <div className="border-b border-slate-200 px-5 pt-3.5 flex items-center gap-6 overflow-x-auto scrollbar-none bg-slate-50/30">
        {[
          { key: 'features', label: 'Features & Limits' },
          { key: 'pricing', label: 'Pricing' },
          { key: 'trial', label: 'Trial & Billing' },
          { key: 'addons', label: 'Add-ons' },
          { key: 'permissions', label: 'Permissions' },
          { key: 'history', label: 'History' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-emerald-600'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="p-5 sm:p-6">
        {/* 1. Features & Limits Tab (Matches Screenshot) */}
        {activeTab === 'features' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Feature Matrix Table (approx 7-8 cols on xl) */}
            <div className="xl:col-span-8 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    <th className="py-2.5 pr-4 font-semibold">Features</th>
                    <th className="py-2.5 px-4 font-semibold">Included</th>
                    <th className="py-2.5 pl-4 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100/80">
                  {categories.map((cat) => (
                    <React.Fragment key={cat.category}>
                      {/* Category Header Row */}
                      <tr className="bg-slate-50/50">
                        <td
                          colSpan={3}
                          className="pt-4 pb-1.5 font-bold text-[11px] text-slate-400 uppercase tracking-wider"
                        >
                          {cat.category}
                        </td>
                      </tr>

                      {/* Items in Category */}
                      {cat.items.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Feature Name & Icon */}
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                {renderFeatureIcon(item.iconName)}
                              </div>
                              <span className="font-semibold text-slate-800">
                                {item.name}
                              </span>
                            </div>
                          </td>

                          {/* Included Status/Value */}
                          <td className="py-3 px-4">
                            {typeof item.included === 'boolean' && item.included ? (
                              <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            ) : (
                              <span className="font-bold text-slate-900">
                                {item.included}
                              </span>
                            )}
                          </td>

                          {/* Details Description */}
                          <td className="py-3 pl-4 text-slate-500">
                            {item.details}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right Sub-card: "What's Included in Growth Plan" */}
            <div className="xl:col-span-4 bg-[#F0FDF4] rounded-2xl p-5 border border-emerald-100/80 space-y-4">
              <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                What&apos;s Included in {plan.name} Plan
              </h3>

              <div className="space-y-2.5">
                {whatsIncludedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 text-xs text-slate-700 font-medium"
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Compare Plans Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenComparePlans}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-500" />
                  <span>Compare Plans</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <span className="text-slate-400 font-medium block">Monthly Fee</span>
                <div className="text-xl font-bold text-slate-900">{plan.price}</div>
                <span className="text-slate-500 block">Billed every 30 days automatically</span>
              </div>
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/70 space-y-2">
                <span className="text-emerald-700 font-medium block">Annual Fee (Discounted)</span>
                <div className="text-xl font-bold text-emerald-900">{plan.yearlyPrice || '৳25,000'}</div>
                <span className="text-emerald-700 font-semibold block">Includes 2 months free (17% OFF)</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <span className="text-slate-400 font-medium block">Setup & Onboarding</span>
                <div className="text-xl font-bold text-slate-900">FREE (৳0)</div>
                <span className="text-slate-500 block">Zero setup charges or hidden maintenance fees</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h4 className="font-bold text-slate-900">Multi-Currency Rate Matrix</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">BDT (Bangladeshi Taka)</span>
                  <span className="text-sm font-bold text-slate-900 block mt-1">৳2,500 / mo</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">USD (US Dollar)</span>
                  <span className="text-sm font-bold text-slate-900 block mt-1">$25.00 / mo</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">EUR (Euro)</span>
                  <span className="text-sm font-bold text-slate-900 block mt-1">€23.00 / mo</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">GBP (British Pound)</span>
                  <span className="text-sm font-bold text-slate-900 block mt-1">£20.00 / mo</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Trial & Billing Tab */}
        {activeTab === 'trial' && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Trial Configuration</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-500 font-medium block mb-1">Trial Length (Days)</label>
                    <input
                      type="number"
                      value={trialDays}
                      onChange={(e) => setTrialDays(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="font-semibold text-slate-800 block">Require Credit Card upfront</span>
                      <span className="text-slate-400 text-[11px]">Merchants must provide payment info to start trial</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRequireCreditCard(!requireCreditCard)}
                      className="cursor-pointer"
                    >
                      {requireCreditCard ? (
                        <ToggleRight className="w-8 h-8 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Enabled Payment Gateways</h4>
                <div className="space-y-2.5">
                  {[
                    { key: 'bkash', name: 'bKash Direct Merchant Gateway' },
                    { key: 'nagad', name: 'Nagad Online Payment' },
                    { key: 'sslcommerz', name: 'SSLCommerz (Cards & NetBanking)' },
                    { key: 'stripe', name: 'Stripe International' },
                  ].map((gw) => (
                    <div key={gw.key} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-700">{gw.name}</span>
                      <span className="text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Add-ons Tab */}
        {activeTab === 'addons' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Available Plan Add-ons</h4>
                <p className="text-slate-500">Merchants on the {plan.name} plan can purchase these capacity extensions.</p>
              </div>
              <button
                type="button"
                onClick={() => toast.info('Configure new add-on')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold shadow-xs hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Add-on</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(plan.addons || []).map((addon) => (
                <div
                  key={addon.id}
                  className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block">{addon.name}</span>
                    <p className="text-slate-500 text-[11px]">{addon.description}</p>
                    <div className="pt-1.5 flex items-center gap-2">
                      <span className="font-bold text-slate-900">{addon.price}</span>
                      <span className="text-slate-400 text-[11px]">{addon.billingPeriod}</span>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-bold text-[11px] px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    Available
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Feature Access & Role Permissions</h4>
              <p className="text-slate-500">Privileges granted to merchants subscribed to the {plan.name} tier.</p>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {(plan.permissions || []).map((perm) => (
                <div key={perm.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{perm.name}</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                        {perm.category}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px] block mt-0.5">{perm.description}</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      perm.allowed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {perm.allowed ? 'Allowed' : 'Restricted'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Audit Trail & Version History</h4>
              <p className="text-slate-500">Record of modifications made to this plan tier.</p>
            </div>

            <div className="space-y-3">
              {(plan.history || []).map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 flex items-start gap-3.5"
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{item.title}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{item.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{item.description}</p>
                    <span className="text-[10px] text-slate-400 block mt-1 font-medium">By {item.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
