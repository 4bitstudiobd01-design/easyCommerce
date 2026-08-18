'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Package,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  storeSlug?: string;
  primaryColor?: string;
  initialMode?: 'login' | 'register';
  onAuthSuccess?: (customer: { name: string; email?: string; phone: string }) => void;
}

export function CustomerAuthModal({
  isOpen,
  onClose,
  storeName = 'Our Store',
  storeSlug = 'main',
  primaryColor = '#2563eb',
  initialMode = 'login',
  onAuthSuccess,
}: CustomerAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // phone or email
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter your phone number or email.');
      return;
    }
    if (!password.trim()) {
      toast.error('Please enter your password.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    // Simulate customer authentication / session storage
    setTimeout(() => {
      setIsLoading(false);
      const customerData = {
        name: mode === 'register' ? name : (name || identifier.split('@')[0] || 'Customer'),
        phone: identifier.includes('@') ? '' : identifier,
        email: identifier.includes('@') ? identifier : '',
      };

      try {
        localStorage.setItem(`bitcommerce_customer_${storeSlug}`, JSON.stringify(customerData));
      } catch (err) {
        // Ignore localStorage quota errors
      }

      toast.success(
        mode === 'register'
          ? `Welcome to ${storeName}! Your customer account is ready.`
          : `Welcome back, ${customerData.name}!`
      );

      onAuthSuccess?.(customerData);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div
          className="px-6 pt-6 pb-5 text-white relative overflow-hidden"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-1.5 backdrop-blur-xs">
                <Sparkles className="w-3 h-3" />
                <span>Customer Portal</span>
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">
                {mode === 'login' ? `Sign In to ${storeName}` : `Join ${storeName}`}
              </h2>
              <p className="text-white/80 text-xs mt-0.5 font-medium">
                {mode === 'login'
                  ? 'Access your orders, saved addresses, and express checkout.'
                  : 'Create your customer account to track orders easily.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-colors -mr-2 -mt-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Belal Hossain"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number or Email
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="017XXXXXXXX or you@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
            style={{ backgroundColor: primaryColor }}
          >
            {isLoading ? (
              <span>Please wait...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Track Order Link */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Want to track an existing order?</span>
            <a
              href={`/store/${storeSlug}/track`}
              className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
