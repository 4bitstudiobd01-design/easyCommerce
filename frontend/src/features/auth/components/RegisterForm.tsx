'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRegisterMerchantMutation } from '../api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../slices/authSlice';
import { useRouter } from 'next/navigation';
import { Store, ArrowRight, ShieldCheck, CheckCircle2, User, Mail, Phone, Lock, Sparkles, LogIn } from 'lucide-react';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [registerMerchant, { isLoading }] = useRegisterMerchantMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const response = await registerMerchant({
        email,
        password,
        fullName,
        phone,
      }).unwrap();

      dispatch(
        setCredentials({
          user: response.user,
          token: response.accessToken,
        })
      );

      toast.success('Store account created successfully.');
      router.push('/dashboard');
    } catch (err: any) {
      const message = err?.data?.message || 'Registration failed. Please check your details.';
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return (
    <div className="w-full max-w-md p-8 solid-card rounded-2xl relative bg-white border border-slate-200 shadow-xl">
      {/* Solid Accent Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600 rounded-t-2xl" />

      <div className="flex items-center gap-3.5 mb-6 pt-2">
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Store Account</h2>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Free</span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">Start selling in Bangladesh in 5 minutes</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahim Ahmed"
              className="w-full pl-10 pr-4 py-3 solid-input rounded-xl text-slate-900 text-sm placeholder-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="merchant@easycommerce.com"
              className="w-full pl-10 pr-4 py-3 solid-input rounded-xl text-slate-900 text-sm placeholder-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+8801700000000"
              className="w-full pl-10 pr-4 py-3 solid-input rounded-xl text-slate-900 text-sm placeholder-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 solid-input rounded-xl text-slate-900 text-sm placeholder-slate-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-md shadow-blue-600/20 disabled:opacity-50 active:scale-95"
        >
          {isLoading ? (
            <span>Creating Store Account...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Create Free Store Account</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </form>

      {/* Link to Login */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600 font-medium">
          Already have a merchant account?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 font-medium pt-2">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tenant Isolated</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Zero Code Setup</span>
        </div>
      </div>
    </div>
  );
}
