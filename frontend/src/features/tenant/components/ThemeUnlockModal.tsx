'use client';

import React, { useState } from 'react';
import { StoreThemeItem, useInitiateThemePaymentMutation } from '../api/tenantApi';
import { X, Sparkles, Check, Lock, ShieldCheck, CreditCard, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ThemeUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: StoreThemeItem | null;
}

export const ThemeUnlockModal: React.FC<ThemeUnlockModalProps> = ({ isOpen, onClose, theme }) => {
  const [initiatePayment, { isLoading }] = useInitiateThemePaymentMutation();

  if (!isOpen || !theme) return null;

  const handleUnlockPayment = async () => {
    try {
      toast.loading('Initiating SSLCommerz Payment Session...', { id: 'theme-pay' });
      const res = await initiatePayment(theme.id).unwrap();

      if (res.isFree) {
        toast.success(res.message || `Theme "${theme.name}" unlocked!`, { id: 'theme-pay' });
        onClose();
        return;
      }

      if (res.gatewayUrl) {
        toast.success('Redirecting to SSLCommerz Gateway (bKash / Nagad / Cards)...', { id: 'theme-pay' });
        window.location.href = res.gatewayUrl;
      } else {
        toast.error(res.message || 'Failed to generate SSLCommerz payment URL.', { id: 'theme-pay' });
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Payment initiation failed. Please try again.', { id: 'theme-pay' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-400/30 text-amber-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Unlock Premium Storefront Theme</h3>
              <p className="text-xs text-slate-400">SSLCommerz Payment Gateway Integration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Theme Banner & Price */}
          <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
            <img src={theme.previewImage} alt={theme.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {theme.category}
                </span>
                <h4 className="font-extrabold text-lg text-white mt-1">{theme.name}</h4>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200 rounded-2xl p-4">
            <div>
              <span className="text-xs font-bold text-amber-900 block">Lifetime Store License</span>
              <span className="text-[11px] text-amber-700">Official SSLCommerz Online Payment</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-950">৳{theme.price.toLocaleString()} BDT</span>
            </div>
          </div>

          {/* Payment Gateway */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-slate-700 block">Payment Gateway:</span>
            <div className="p-3 rounded-2xl border border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-600/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                SSL
              </div>
              <div className="text-xs">
                <span className="block font-extrabold">SSLCommerz</span>
                <span className="text-[10px] text-slate-500 block">bKash, Nagad, Visa, MC — choose on the payment page</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleUnlockPayment}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition active:scale-95"
            >
              {isLoading ? (
                'Connecting Gateway...'
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Pay ৳{theme.price.toLocaleString()} via SSLCommerz
                  <ExternalLink className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
