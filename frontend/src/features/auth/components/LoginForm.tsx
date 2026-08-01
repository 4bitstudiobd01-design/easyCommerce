'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLoginMutation } from '../api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../slices/authSlice';
import { useRouter } from 'next/navigation';
import { LogIn, ArrowRight, Mail, Lock, Store, Sparkles } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const response = await login({ email, password }).unwrap();

      dispatch(
        setCredentials({
          user: response.user,
          token: response.accessToken,
        })
      );

      if (response.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(
        err?.data?.message || 'Invalid credentials. Please try again.'
      );
    }
  };

  return (
    <div className="w-full max-w-md p-8 solid-card rounded-2xl relative bg-white border border-slate-200 shadow-xl">
      {/* Solid Accent Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600 rounded-t-2xl" />

      <div className="flex items-center gap-3.5 mb-6 pt-2">
        <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
          <LogIn className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Merchant Sign In</h2>
          <p className="text-slate-500 text-xs mt-0.5">Sign in to your EasyCommerce Control Panel</p>
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
            <span>Authenticating...</span>
          ) : (
            <>
              <span>Sign In to Admin</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Link to Register */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600 font-medium">
          New to EasyCommerce?{' '}
          <Link href="/register" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Free Store Account</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
