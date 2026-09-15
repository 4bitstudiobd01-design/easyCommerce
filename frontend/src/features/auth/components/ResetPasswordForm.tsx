'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useResetPasswordMutation } from '../api/authApi';
import { useRouter } from 'next/navigation';
import { Mail, Lock, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!/^\d{6}$/.test(otp)) {
      setErrorMsg('Enter the 6-digit code we emailed you.');
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 72) {
      setErrorMsg('Password must be between 6 and 72 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      await resetPassword({ email: email.trim(), otp, newPassword }).unwrap();

      toast.success('Password reset. Please log in.');
      router.push('/login');
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
      <h2 className="text-[24px] font-extrabold text-slate-900 tracking-tight mb-1.5">Reset password</h2>
      <p className="text-[12.5px] font-medium text-slate-500 mb-6 text-center">
        Enter the code we emailed you and choose a new password.
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
              disabled={!!emailFromQuery}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your account email"
              className="w-full pl-10 pr-4 h-10 border border-slate-200 rounded-xl text-slate-900 text-[13px] font-medium placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        </div>

        {/* OTP Field */}
        <div>
          <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
            Reset Code
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className="w-full pl-10 pr-4 h-10 border border-slate-200 rounded-xl text-slate-900 text-[13px] font-bold tracking-[0.3em] placeholder-slate-400 placeholder:tracking-normal placeholder:font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* New Password Field */}
        <div>
          <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
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

        {/* Confirm Password Field */}
        <div>
          <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
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
          {isLoading ? <span>Resetting password...</span> : <span>Reset Password</span>}
        </button>

      </form>

      <p className="text-[12.5px] font-medium text-slate-500 mt-5">
        Didn't get a code?{' '}
        <Link href="/forgot-password" className="text-blue-600 font-bold hover:underline">Request a new one</Link>
      </p>

      {/* Security Badge */}
      <div className="flex items-center gap-2.5 text-[10.5px] font-medium text-slate-500 max-w-[280px] text-left mt-6">
        <ShieldCheck className="w-5 h-5 shrink-0 text-slate-400" />
        <p>Resetting your password signs you out of all other devices.</p>
      </div>

    </div>
  );
}
