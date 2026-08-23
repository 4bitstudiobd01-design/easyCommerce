'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useForgotPasswordMutation } from '../api/authApi';
import { useRouter } from 'next/navigation';
import { Mail, ShieldCheck } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await forgotPassword({ email: email.trim() }).unwrap();

      toast.success('Reset code sent — check your email.');
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err: any) {
      let message = 'Something went wrong. Please try again.';
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
    <div className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-7 flex flex-col items-center">

      {/* Header */}
      <h2 className="text-[24px] font-extrabold text-slate-900 tracking-tight mb-1.5">Forgot password?</h2>
      <p className="text-[12.5px] font-medium text-slate-500 mb-6 text-center">
        Enter your account email and we'll send you a reset code.
      </p>

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
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your account email"
              className="w-full pl-10 pr-4 h-10 border border-slate-200 rounded-xl text-slate-900 text-[13px] font-medium placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-[13.5px] shadow-md shadow-blue-600/20 disabled:opacity-50 active:scale-[0.98]"
        >
          {isLoading ? <span>Sending code...</span> : <span>Send Reset Code</span>}
        </button>

      </form>

      <p className="text-[12.5px] font-medium text-slate-500 mt-5">
        Remember your password?{' '}
        <Link href="/login" className="text-blue-600 font-bold hover:underline">Back to login</Link>
      </p>

      {/* Security Badge */}
      <div className="flex items-center gap-2.5 text-[10.5px] font-medium text-slate-500 max-w-[280px] text-left mt-6">
        <ShieldCheck className="w-5 h-5 shrink-0 text-slate-400" />
        <p>For your security, the reset code expires in 10 minutes.</p>
      </div>

    </div>
  );
}
