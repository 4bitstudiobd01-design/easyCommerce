'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  X,
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Package,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useLoginCustomerMutation,
  useRegisterCustomerMutation,
} from '../api/customerAuthApi';
import { setCustomerCredentials } from '../slices/customerAuthSlice';
import { readStoredAttribution, resolveAttributionFromEnvironment } from '../utils/attribution';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  storeSlug?: string;
  primaryColor?: string;
  initialMode?: 'login' | 'register';
}

export function CustomerAuthModal({
  isOpen,
  onClose,
  storeName = 'Our Store',
  storeSlug = 'main',
  primaryColor = '#2563eb',
  initialMode = 'login',
}: CustomerAuthModalProps) {
  const dispatch = useDispatch();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [loginCustomer, { isLoading: isLoginLoading }] = useLoginCustomerMutation();
  const [registerCustomer, { isLoading: isRegisterLoading }] = useRegisterCustomerMutation();

  const isLoading = isLoginLoading || isRegisterLoading;

  // The modal stays mounted between opens (only `isOpen` toggles), so plain
  // useState(...) initializers only capture their value from the very first
  // mount — neither the mode nor the typed-in fields ever cleared on their
  // own afterward. That meant switching "Sign In" -> "Create Account" stuck
  // on the old mode, and a previous session's email/password stayed filled
  // in the next time the modal opened (e.g. after logging out). Reset
  // everything fresh every time the modal is opened.
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setShowPassword(false);
      setErrorMsg('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMsg('Please enter your email and password.');
        return;
      }

      try {
        const res = await loginCustomer({
          storeSlug,
          email: email.trim().toLowerCase(),
          password,
          rememberMe: true,
        }).unwrap();

        dispatch(
          setCustomerCredentials({
            customer: res.user,
            token: res.accessToken,
            refreshToken: res.refreshToken,
          })
        );

        const displayName = `${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() || res.user.email;
        toast.success(`Welcome back, ${displayName}!`);
        onClose();
      } catch (err: any) {
        let msg = 'Invalid credentials. Please try again.';
        if (err?.status === 'FETCH_ERROR' || err?.error?.includes?.('Failed to fetch')) {
          msg = 'Unable to connect to server. Please try again shortly.';
        } else if (err?.data?.message) {
          msg = Array.isArray(err.data.message) ? err.data.message[0] : err.data.message;
        }
        setErrorMsg(msg);
        toast.error(msg);
      }
    } else {
      if (!name.trim() || !email.trim() || !phone.trim() || !password) {
        setErrorMsg('Please fill in all fields.');
        return;
      }

      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      const attribution = readStoredAttribution() || resolveAttributionFromEnvironment();

      try {
        const res = await registerCustomer({
          storeSlug,
          firstName,
          lastName,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          channel: attribution.channel,
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          referrerHost: attribution.referrerHost,
        }).unwrap();

        dispatch(
          setCustomerCredentials({
            customer: res.user,
            token: res.accessToken,
            refreshToken: res.refreshToken,
          })
        );

        toast.success(`Welcome to ${storeName}! Your customer account is ready.`);
        onClose();
      } catch (err: any) {
        let msg = 'Failed to create account. Please try again.';
        if (err?.status === 'FETCH_ERROR' || err?.error?.includes?.('Failed to fetch')) {
          msg = 'Unable to connect to server. Please try again shortly.';
        } else if (err?.data?.message) {
          msg = Array.isArray(err.data.message) ? err.data.message[0] : err.data.message;
        }
        setErrorMsg(msg);
        toast.error(msg);
      }
    }
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white rounded-[28px] shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden z-10 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-7 pt-8 pb-6 text-center">
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
            style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -6px ${primaryColor}66` }}
          >
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {mode === 'login' ? 'Welcome back' : `Join ${storeName}`}
          </h2>
          <p className="text-slate-500 text-xs mt-1.5 font-medium leading-relaxed max-w-[260px] mx-auto">
            {mode === 'login'
              ? 'Sign in to track orders and check out faster.'
              : 'Create an account to track orders and save your details.'}
          </p>
        </div>

        {/* Segmented Toggle */}
        <div className="px-7">
          <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-7 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="p-7 pt-5 space-y-3.5">
          {mode === 'register' && (
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-transparent rounded-2xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-transparent rounded-2xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
            />
          </div>

          {mode === 'register' && (
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-transparent rounded-2xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-11 pr-11 h-12 bg-slate-50 border border-transparent rounded-2xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-white text-sm font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-1"
            style={{ backgroundColor: primaryColor, boxShadow: `0 10px 24px -8px ${primaryColor}80` }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Track Order Link */}
          <div className="pt-4 mt-1 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Have an order?</span>
            <a
              href={`/store/${storeSlug}/track`}
              className="font-bold hover:underline inline-flex items-center gap-1"
              style={{ color: primaryColor }}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Track it here</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
