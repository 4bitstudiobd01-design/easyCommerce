'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/features/tenant/api/tenantApi';

export default function PolicySettingsPage() {
  const router = useRouter();
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();

  const [formData, setFormData] = useState({
    privacyPolicy: '',
    termsOfService: '',
    refundPolicy: '',
  });

  useEffect(() => {
    if (store) {
      setFormData({
        privacyPolicy: store.privacyPolicy || '',
        termsOfService: store.termsOfService || '',
        refundPolicy: store.refundPolicy || '',
      });
    }
  }, [store]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    try {
      await updateStore({
        privacyPolicy: formData.privacyPolicy,
        termsOfService: formData.termsOfService,
        refundPolicy: formData.refundPolicy,
      }).unwrap();
      toast.success('Shop policies updated successfully.');
    } catch (error) {
      toast.error('Failed to update policies. Please try again.');
    }
  };

  if (isStoreLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <button
        type="button"
        onClick={() => router.push('/dashboard/settings')}
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all w-fit"
      >
        <ArrowLeft className="w-4 h-4 text-slate-600" />
        <span>Back to Manage Shop</span>
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Shop Policies</h2>
          </div>
          <p className="text-xs text-slate-500">
            Define your store's legal policies. These will be automatically linked in your store's footer.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Privacy Policy</label>
            <textarea
              name="privacyPolicy"
              value={formData.privacyPolicy}
              onChange={handleChange}
              rows={6}
              placeholder="Enter your privacy policy here..."
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-y"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Terms of Service</label>
            <textarea
              name="termsOfService"
              value={formData.termsOfService}
              onChange={handleChange}
              rows={6}
              placeholder="Enter your terms of service here..."
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-y"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Refund & Return Policy</label>
            <textarea
              name="refundPolicy"
              value={formData.refundPolicy}
              onChange={handleChange}
              rows={6}
              placeholder="Enter your refund policy here..."
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-y"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isUpdating ? 'Saving Policies...' : 'Save Policies'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
