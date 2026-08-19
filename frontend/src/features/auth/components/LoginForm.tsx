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

      toast.success('Signed in successfully.');

      if (response.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const message = err?.data?.message || 'Invalid credentials. Please try again.';
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-7 flex flex-col items-center">

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
            <Link href="#" className="text-[12px] font-bold text-blue-600 hover:underline">
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

      {/* Divider */}
      <div className="w-full flex items-center gap-4 my-4">
        <div className="flex-1 h-px bg-slate-100"></div>
        <span className="text-[12px] font-medium text-slate-400">or continue with</span>
        <div className="flex-1 h-px bg-slate-100"></div>
      </div>

      {/* Social Buttons */}
      <div className="w-full grid grid-cols-3 gap-3 mb-4">
        <button className="h-9 flex items-center justify-center gap-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-[13px] font-bold text-slate-700 hidden sm:block">Google</span>
        </button>
        <button className="h-9 flex items-center justify-center gap-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span className="text-[13px] font-bold text-slate-700 hidden sm:block">Facebook</span>
        </button>
        <button className="h-9 flex items-center justify-center gap-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.641-.026 2.669-1.48 3.655-2.922 1.156-1.682 1.631-3.313 1.657-3.398-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.68.827-1.333 2.275-1.144 3.644 1.346.104 2.597-.61 3.431-1.632z"/>
          </svg>
          <span className="text-[13px] font-bold text-slate-700 hidden sm:block">Apple</span>
        </button>
      </div>

      {/* Security Badge */}
      <div className="flex items-center gap-2.5 text-[10.5px] font-medium text-slate-500 max-w-[280px] text-left">
        <ShieldCheck className="w-5 h-5 shrink-0 text-slate-400" />
        <p>Your data is protected with industry-standard security and encryption.</p>
      </div>

    </div>
  );
}
