'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRegisterMerchantMutation } from '../api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../slices/authSlice';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Store,
  Briefcase,
  ChevronDown,
  UserPlus,
  Gift,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

/** Public storefront domain shown as the subdomain suffix. */
const STORE_DOMAIN = '.bitcommerce.app';

/**
 * The phone input only collects the subscriber number without the leading 0
 * (e.g. `1700000000`), matching what a Bangladeshi mobile number looks like
 * after the leading 0 is dropped for the +880 country code.
 */
const PHONE_PATTERN = /^1[3-9]\d{8}$/;

/** Strips any `+880`/`880`/leading-0` a user might paste in, leaving the bare subscriber number. */
function normalizePhone(value: string): string {
  const digitsOnly = value.trim().replace(/[\s-]/g, '');
  return digitsOnly.replace(/^(?:\+?880|0)/, '');
}

/** Combines the +880 country code with the local subscriber number for submission. */
function toE164(localPhone: string): string {
  return `+880${localPhone}`;
}

const BUSINESS_TYPES = [
  'Fashion & Apparel',
  'Electronics',
  'Health & Beauty',
  'Home & Living',
  'Food & Grocery',
  'Books & Stationery',
  'Other',
];

const COUNTRIES = ['Bangladesh'];

/** Derives a URL-safe slug, matching the backend CreateStoreDto slug rule. */
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

export function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [businessType, setBusinessType] = useState('');
  const [country, setCountry] = useState('Bangladesh');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [registerMerchant, { isLoading }] = useRegisterMerchantMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  // The subdomain tracks the store name until the merchant customizes it.
  const handleStoreNameChange = (value: string) => {
    setStoreName(value);
    if (!subdomainEdited) {
      setSubdomain(toSlug(value));
    }
  };

  const validate = (): string | null => {
    if (fullName.trim().length < 2) {
      return 'Please enter your full name.';
    }
    const localPhone = normalizePhone(phone);
    if (localPhone && !PHONE_PATTERN.test(localPhone)) {
      return 'Enter a valid phone number, e.g. 1700000000.';
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return 'Password must be at least 8 characters and include letters and numbers.';
    }
    if (storeName.trim().length < 2) {
      return 'Please enter your store name.';
    }
    if (subdomain.trim().length < 3) {
      return 'Store subdomain must be at least 3 characters.';
    }
    if (!businessType) {
      return 'Please select your business type.';
    }
    if (!acceptedTerms) {
      return 'Please accept the Terms of Service to continue.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      toast.error(validationError);
      return;
    }

    try {
      const localPhone = normalizePhone(phone);
      const trimmedStoreName = storeName.trim();
      const trimmedSubdomain = subdomain.trim();

      const response = await registerMerchant({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        acceptedTerms,
        ...(localPhone ? { phone: toE164(localPhone) } : {}),
        ...(trimmedStoreName && trimmedSubdomain
          ? {
              storeName: trimmedStoreName,
              storeSlug: trimmedSubdomain,
              subdomain: trimmedSubdomain,
              businessType: businessType || undefined,
              category: businessType || undefined,
              country,
              address: country || undefined,
            }
          : {}),
      }).unwrap();

      dispatch(
        setCredentials({
          user: response.user,
          token: response.accessToken,
          refreshToken: response.refreshToken,
        })
      );

      toast.success('Store account created successfully.');
      router.replace('/dashboard');
    } catch (err: any) {
      let message = 'Registration failed. Please check your details.';
      if (err?.status === 'FETCH_ERROR' || err?.error?.includes?.('Failed to fetch')) {
        message = 'Unable to connect to server. Please ensure the backend server is running on port 5001.';
      } else if (err?.data?.message) {
        message = Array.isArray(err.data.message) ? err.data.message[0] : err.data.message;
      } else if (err?.data?.errorSources?.[0]?.details) {
        message = err.data.errorSources[0].details;
      }
      setErrorMsg(message);
      toast.error(message);
    }
  };

  const fieldClass =
    'w-full pl-10 pr-4 h-9 bg-white border border-slate-200 rounded-xl text-slate-900 text-[13px] font-medium placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors';
  const labelClass = 'block text-[12.5px] font-bold text-slate-700 mb-0.5';
  const hintClass = 'text-[10.5px] font-medium text-slate-400 mt-0.5';

  return (
    <div className="w-full max-w-[560px] mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-[19px] font-extrabold text-slate-900 tracking-tight mb-0.5">Create your account</h2>
          <p className="text-[12.5px] font-medium text-slate-500">Join thousands of merchants using BitCommerce</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {/* Left stack — sized independently so a hint on the right doesn't stretch these rows */}
            <div className="flex flex-col gap-y-3.5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className={fieldClass}
                  />
                </div>
              </div>

              {/* Phone with country code */}
              <div>
                <label htmlFor="phone" className={labelClass}>Phone Number</label>
                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] leading-none">🇧🇩</span>
                    <select
                      aria-label="Country calling code"
                      value="+880"
                      onChange={() => {}}
                      className="h-9 pl-8 pr-7 bg-white border border-slate-200 rounded-xl text-slate-700 text-[13px] font-medium appearance-none focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer"
                    >
                      <option value="+880">+880</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(normalizePhone(e.target.value))}
                      maxLength={10}
                      placeholder="1700000000"
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>

              {/* Store Name */}
              <div>
                <label htmlFor="storeName" className={labelClass}>Store Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="storeName"
                    type="text"
                    value={storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    placeholder="Enter your store name"
                    className={fieldClass}
                  />
                </div>
              </div>

              {/* Business Type */}
              <div>
                <label htmlFor="businessType" className={labelClass}>Business Type <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                  <select
                    id="businessType"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className={`${fieldClass} appearance-none cursor-pointer ${businessType ? 'text-slate-900' : 'text-slate-400'}`}
                  >
                    <option value="">Select your business type</option>
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type} value={type} className="text-slate-900">{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Right stack */}
            <div className="flex flex-col gap-y-3.5">
              {/* Email */}
              <div>
                <label htmlFor="email" className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={fieldClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className={labelClass}>Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full pl-10 pr-10 h-9 bg-white border border-slate-200 rounded-xl text-slate-900 text-[13px] font-medium placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Store Subdomain */}
              <div>
                <label htmlFor="subdomain" className={labelClass}>Store Subdomain <span className="text-red-500">*</span></label>
                <div className="flex items-stretch h-9 bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-colors">
                  <input
                    id="subdomain"
                    type="text"
                    value={subdomain}
                    onChange={(e) => {
                      setSubdomainEdited(true);
                      setSubdomain(toSlug(e.target.value));
                    }}
                    placeholder="yourstore"
                    className="flex-1 min-w-0 px-3.5 text-slate-900 text-[13px] font-medium placeholder-slate-400 focus:outline-none"
                  />
                  <span className="flex items-center px-3 bg-slate-50 border-l border-slate-200 text-slate-500 text-[12.5px] font-medium shrink-0">
                    {STORE_DOMAIN}
                  </span>
                </div>
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className={labelClass}>Country</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] leading-none z-10">🇧🇩</span>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-10 pr-9 h-9 bg-white border border-slate-200 rounded-xl text-slate-900 text-[13px] font-medium appearance-none focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer"
                  >
                    {COUNTRIES.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2 mt-4">
            <input
              id="accept-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer shrink-0"
            />
            <label htmlFor="accept-terms" className="text-[12.5px] font-medium text-slate-600 cursor-pointer leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" target="_blank" className="text-blue-600 font-bold hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" className="text-blue-600 font-bold hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-[13.5px] shadow-md shadow-blue-600/20 disabled:opacity-50 active:scale-[0.99]"
          >
            {isLoading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Free trial banner */}
        <div className="mt-5 flex items-center gap-3 p-3 bg-[#F6F8FF] border border-blue-100 rounded-xl">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-bold text-slate-900">Start your 14-day free trial</h4>
            <p className="text-[11.5px] font-medium text-slate-500">No credit card required. Cancel anytime.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2.5 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Your data is protected with industry-standard security.</span>
        </div>
        <p className="text-[11.5px] font-medium text-slate-400">© 2026 BitCommerce. All rights reserved.</p>
      </div>
    </div>
  );
}
