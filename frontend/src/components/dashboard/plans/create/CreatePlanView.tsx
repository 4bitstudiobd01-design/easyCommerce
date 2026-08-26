'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { CreatePlanFormData, PlanRecord } from '../types';
import { PlanInfoSection } from './PlanInfoSection';
import { PricingBillingSection } from './PricingBillingSection';
import { PlanLimitsSection } from './PlanLimitsSection';
import { PlanPreviewCard } from './PlanPreviewCard';
import { PlanStatusCard } from './PlanStatusCard';
import { PlanQuickSummaryCard } from './PlanQuickSummaryCard';
import { PlanCreateActionsCard } from './PlanCreateActionsCard';
import { toast } from 'sonner';

interface CreatePlanViewProps {
  onBack: () => void;
  onCreatePlan: (newPlan: PlanRecord) => void;
}

const INITIAL_FORM_DATA: CreatePlanFormData = {
  name: '',
  code: '',
  description: '',
  badge: '',
  displayOrder: 0,
  price: '',
  billingCycle: 'Monthly',
  yearlyPrice: '',
  offerYearlyDiscount: true,
  yearlyDiscountPercent: 17,
  stores: 1,
  products: '1000',
  productVariants: 'Unlimited',
  monthlyOrders: '500',
  staffAccounts: 5,
  storage: 10,
  storageUnit: 'GB',
  bandwidth: 100,
  bandwidthUnit: 'GB',
  customDomain: true,
  status: 'Active',
  visibility: 'Visible to all merchants',
  featureHighlights: [
    'Feature highlight goes here',
    'Another key feature',
    'And more great features',
    'Perfect for growing businesses',
  ],
  advancedLimits: {
    apiAccess: true,
    posAccess: true,
    abandonedCart: true,
    multiWarehouse: false,
    webhooks: true,
    smsSends: '1,000 / month',
  },
};

export function CreatePlanView({ onBack, onCreatePlan }: CreatePlanViewProps) {
  const [formData, setFormData] = useState<CreatePlanFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: keyof CreatePlanFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdvancedChange = (
    field: keyof NonNullable<CreatePlanFormData['advancedLimits']>,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      advancedLimits: {
        ...(prev.advancedLimits || ({} as any)),
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Plan Name is required');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('Plan Code is required');
      return;
    }
    if (!formData.price.trim()) {
      toast.error('Price is required');
      return;
    }

    setIsSubmitting(true);

    const newPlan: PlanRecord = {
      id: `plan-${formData.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
      name: formData.name,
      code: formData.code.toUpperCase(),
      subtitle: formData.description.slice(0, 80) || `Comprehensive ${formData.name} tier`,
      badge: formData.badge,
      displayOrder: formData.displayOrder,
      featuresCountText: '15 features',
      iconType: 'growth',
      iconBg: 'bg-emerald-600',
      price: formData.price.startsWith('৳') ? formData.price : `৳${formData.price}`,
      yearlyPrice: formData.yearlyPrice
        ? formData.yearlyPrice.startsWith('৳')
          ? formData.yearlyPrice
          : `৳${formData.yearlyPrice}`
        : `৳${Math.round((parseFloat(formData.price.replace(/[^0-9.]/g, '')) || 0) * 10)}`,
      yearlyDiscount: formData.offerYearlyDiscount
        ? `Save ${formData.yearlyDiscountPercent}%`
        : undefined,
      billingPeriod: '/ month',
      billingCycle: formData.billingCycle,
      trialDays: 14,
      trialAvailable: true,
      visibility: formData.visibility,
      merchantsCount: '0',
      merchantsShare: '(0%)',
      mrr: '৳0',
      mrrShare: '(0%)',
      status: formData.status,
      createdAt: {
        date: 'Aug 20, 2026',
        time: '02:45 PM',
      },
      updatedAt: {
        date: 'Aug 20, 2026',
        time: '02:45 PM',
      },
      description: formData.description || `The ${formData.name} plan designed for merchants.`,
      featuresUsed: 15,
      featuresTotal: 50,
      whatsIncluded: [
        `Stores: ${formData.stores}`,
        `Products: ${formData.products}`,
        `Staff Accounts: ${formData.staffAccounts}`,
        `Orders: ${formData.monthlyOrders}/mo`,
        `Storage: ${formData.storage} ${formData.storageUnit}`,
        formData.customDomain ? 'Custom Domain with SSL' : 'Subdomain only',
      ],
      limitsSummary: {
        stores: formData.stores,
        products: formData.products,
        staffAccounts: formData.staffAccounts,
        monthlyOrders: formData.monthlyOrders,
        storage: `${formData.storage} ${formData.storageUnit}`,
        bandwidth: `${formData.bandwidth} ${formData.bandwidthUnit} / month`,
        emailSends: '5,000 / month',
        customDomain: formData.customDomain,
        apiAccess: formData.advancedLimits?.apiAccess ?? true,
      },
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onCreatePlan(newPlan);
      toast.success(`Plan "${newPlan.name}" created successfully!`);
      onBack();
    }, 400);
  };

  const handleSaveDraft = () => {
    toast.info('Plan saved as draft');
  };

  const handleClearForm = () => {
    setFormData(INITIAL_FORM_DATA);
    toast.info('Form cleared');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Breadcrumbs and Action Buttons */}
      <div className="space-y-3">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-emerald-700 transition-colors cursor-pointer"
          >
            Plans
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">Create Plan</span>
        </nav>

        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create New Plan
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-1">
              Create a new subscription plan for merchants on the platform.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Sections (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-6">
          <PlanInfoSection formData={formData} onChange={handleFieldChange} />
          <PricingBillingSection formData={formData} onChange={handleFieldChange} />
          <PlanLimitsSection
            formData={formData}
            onChange={handleFieldChange}
            onAdvancedChange={handleAdvancedChange}
          />
        </div>

        {/* Right Column: Preview & Status Cards (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-5">
          <PlanPreviewCard formData={formData} />
          <PlanStatusCard formData={formData} onChange={handleFieldChange} />
          <PlanQuickSummaryCard
            formData={formData}
            onScrollToLimits={() => {
              window.scrollTo({ top: 500, behavior: 'smooth' });
            }}
          />
          <PlanCreateActionsCard
            onSaveDraft={handleSaveDraft}
            onClearForm={handleClearForm}
          />
        </div>
      </div>
    </div>
  );
}
