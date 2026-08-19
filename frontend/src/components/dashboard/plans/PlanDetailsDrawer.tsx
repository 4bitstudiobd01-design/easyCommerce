'use client';

import React from 'react';
import {
  X,
  Layers,
  Check,
  Edit2,
  Users,
  DollarSign,
  Calendar,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import { PlanRecord } from './types';

interface PlanDetailsDrawerProps {
  plan: PlanRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlanDetailsDrawer({
  plan,
  isOpen,
  onClose,
}: PlanDetailsDrawerProps) {
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl ${plan.iconBg} text-white font-bold text-base flex items-center justify-center shadow-xs`}
              >
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {plan.name} Plan
                </h3>
                <span className="text-xs text-slate-400 font-normal">
                  {plan.subtitle}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-3.5 text-center border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Current MRR</span>
                <span className="text-base font-bold text-slate-900 block mt-1">
                  {plan.mrr}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {plan.mrrShare} share
                </span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3.5 text-center border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Subscribed Merchants</span>
                <span className="text-base font-bold text-slate-900 block mt-1">
                  {plan.merchantsCount}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {plan.merchantsShare} total
                </span>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Plan Specifications
              </h4>
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Price Rate</span>
                  <span className="font-bold text-slate-900">
                    {plan.price} <span className="text-slate-400 font-normal">{plan.billingPeriod}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Billing Interval</span>
                  <span className="font-semibold text-slate-800">
                    {plan.billingCycle}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Features Unlocked</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {plan.featuresUsed} of {plan.featuresTotal} Included
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Visibility Status</span>
                  <span className="font-semibold text-slate-800">
                    {plan.status === 'Active' ? 'Visible to all merchants' : 'Hidden from storefronts'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Creation Date</span>
                  <span className="font-medium text-slate-700">
                    {plan.createdAt.date} at {plan.createdAt.time}
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Included Core Capabilities
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  'Custom domain setup with SSL',
                  'Unlimited product catalog hosting',
                  'Real-time order tracking & SMS alerts',
                  'Automated payout settlements',
                  'Standard 24/7 ticket support',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-slate-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Plan Operations
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Pricing & Quotas</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicate as New Tier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
