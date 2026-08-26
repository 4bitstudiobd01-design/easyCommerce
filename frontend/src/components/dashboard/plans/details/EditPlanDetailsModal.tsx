'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PlanRecord } from '../types';
import { toast } from 'sonner';

interface EditPlanDetailsModalProps {
  plan: PlanRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPlan: PlanRecord) => void;
}

export function EditPlanDetailsModal({
  plan,
  isOpen,
  onClose,
  onSave,
}: EditPlanDetailsModalProps) {
  const [formData, setFormData] = useState<Partial<PlanRecord>>({});

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        code: plan.code || plan.name.toUpperCase(),
        subtitle: plan.subtitle,
        price: plan.price,
        yearlyPrice: plan.yearlyPrice || '৳25,000',
        yearlyDiscount: plan.yearlyDiscount || 'Save 17%',
        billingCycle: plan.billingCycle,
        trialDays: plan.trialDays || 14,
        status: plan.status,
        description: plan.description,
        visibility: plan.visibility || 'Visible to merchants',
      });
    }
  }, [plan]);

  if (!isOpen || !plan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Plan name is required');
      return;
    }
    const updated: PlanRecord = {
      ...plan,
      ...formData,
      name: formData.name || plan.name,
      subtitle: formData.subtitle || plan.subtitle,
      price: formData.price || plan.price,
      updatedAt: {
        date: 'Aug 10, 2026',
        time: '02:15 PM',
      },
    };
    onSave(updated);
    toast.success(`Plan "${updated.name}" updated successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Edit {plan.name} Plan
            </h3>
            <p className="text-xs text-slate-500">
              Modify pricing, quotas, limits, and merchant visibility settings
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plan Name */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Plan Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="e.g. Growth"
                required
              />
            </div>

            {/* Plan Code */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Plan Code / Slug</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase tracking-wide text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="GROWTH"
              />
            </div>

            {/* Monthly Price */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Monthly Price Rate</label>
              <input
                type="text"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="৳2,500"
              />
            </div>

            {/* Annual Price */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Annual Advance Price</label>
              <input
                type="text"
                value={formData.yearlyPrice || ''}
                onChange={(e) => setFormData({ ...formData, yearlyPrice: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                placeholder="৳25,000"
              />
            </div>

            {/* Trial Days */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Free Trial Duration (Days)</label>
              <input
                type="number"
                value={formData.trialDays || 0}
                onChange={(e) => setFormData({ ...formData, trialDays: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Status</label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Subtitle */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Subtitle / Tagline</label>
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="For growing businesses that need more power..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Plan Description</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
