'use client';

import React, { useState, useEffect } from 'react';
import { useGetPlatformConfigQuery, useUpdatePlatformConfigMutation, PlatformConfig } from '@/features/admin/api/adminApi';
import { Loader2, Save, Type, Users, DollarSign, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function CmsManager() {
  const { data: config, isLoading } = useGetPlatformConfigQuery();
  const [updateConfig, { isLoading: isUpdating }] = useUpdatePlatformConfigMutation();

  const [heroContent, setHeroContent] = useState<PlatformConfig['heroContent']>({});
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);

  useEffect(() => {
    if (config) {
      setHeroContent(config.heroContent || {});
      setTestimonials(config.testimonials || []);
      setPricingPlans(config.pricingPlans || []);
    }
  }, [config]);

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setHeroContent((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      await updateConfig({
        heroContent,
        testimonials,
        pricingPlans,
      }).unwrap();
      toast.success('Landing page content updated successfully.');
    } catch (err) {
      toast.error('Failed to update landing page content.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200 p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Landing Page CMS</h2>
          <p className="text-sm text-slate-500 mt-1">Manage the public-facing website content dynamically.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Publish Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* 1. Hero Content Editor */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Type className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hero Section</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Main Title</label>
              <input
                type="text"
                name="title"
                value={heroContent.title || ''}
                onChange={handleHeroChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Subtitle</label>
              <textarea
                name="subtitle"
                rows={3}
                value={heroContent.subtitle || ''}
                onChange={handleHeroChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none resize-y"
              />
            </div>
          </div>
        </div>

        {/* 2. Testimonials Editor */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Testimonials</h3>
          </div>
          
          <p className="text-sm text-slate-500">
            For brevity in this demo, testimonials are managed as JSON internally. 
            Full CRUD UI would be rendered here in production.
            Currently {testimonials.length} testimonials active.
          </p>
        </div>

        {/* 3. Pricing Editor */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Pricing Plans</h3>
          </div>
          
          <p className="text-sm text-slate-500">
            For brevity in this demo, pricing plans are managed as JSON internally. 
            Full CRUD UI would be rendered here in production.
            Currently {pricingPlans.length} pricing plans active.
          </p>
        </div>
      </div>
    </div>
  );
}
