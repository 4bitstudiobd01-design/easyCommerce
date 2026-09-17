'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useLoginMutation } from '../api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../slices/authSlice';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, ShieldCheck, Info } from 'lucide-react';

export function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      setErrorMsg('Please enter your email or phone number.');
      return;
    }

    try {
      const response = await login({
        identifier: trimmedIdentifier,
        password,
        rememberMe,
      }).unwrap();

      dispatch(
        setCredentials({
          user: response.user,
          token: response.accessToken,
          refreshToken: response.refreshToken,
        })
      );

      if (response.store?.id) {
        localStorage.setItem('bitcommerce_active_store_id', response.store.id);
      }

      toast.success('Signed in successfully.');

      if (response.user?.role === 'SUPER_ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    } catch (err: any) {
      let message = 'Invalid credentials. Please try again.';
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

  return (
    <div className="w-full max-w-[560px] bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-7 flex flex-col items-center">

      {/* Header */}
      <h2 className="text-[24px] font-extrabold text-slate-900 tracking-tight mb-1.5">Welcome back!</h2>
      <p className="text-[12.5px] font-medium text-slate-500 mb-6 text-center">Login to your BitCommerce merchant account</p>

      {errorMsg && (
        <div className="w-full mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center">
          {errorMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">

        {/* Email Field */}
        <div>
          <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
            Email or Phone
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or phone number"
              className="w-full pl-10 pr-4 h-10 border border-slate-200 rounded-xl text-slate-900 text-[13px] font-medium placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[13px] font-bold text-slate-700">
              Password
            </label>
            <Link href="/forgot-password" className="text-[12px] font-bold text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-10 h-10 border border-slate-200 rounded-xl text-slate-900 text-[13px] font-medium placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
            />
            <span className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Remember me</span>
          </label>
          <div className="flex items-center gap-1 text-[12px] font-medium text-slate-500">
            Keep me signed in
            <Info className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-[13.5px] shadow-md shadow-blue-600/20 disabled:opacity-50 active:scale-[0.98]"
        >
          {isLoading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Login</span>
            </>
          )}
        </button>

      </form>

      {/* Security Badge */}
      <div className="mt-5 flex items-center gap-2.5 text-[10.5px] font-medium text-slate-500 max-w-[280px] text-left">
        <ShieldCheck className="w-5 h-5 shrink-0 text-slate-400" />
        <p>Your data is protected with industry-standard security and encryption.</p>
      </div>

    </div>
  );
}
