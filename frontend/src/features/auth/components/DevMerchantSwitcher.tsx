'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Wrench, ChevronDown, Store } from 'lucide-react';
import { useGetDevMerchantsQuery, useDevLoginAsMutation } from '../api/authApi';
import { setCredentials } from '../slices/authSlice';

const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';

/**
 * Local/staging-only merchant switcher so HRMS (and other merchant-facing work) can be
 * reviewed from the merchant's own dashboard without a real password or an impersonation
 * feature. Renders nothing unless NEXT_PUBLIC_ENABLE_DEV_LOGIN=true — the backend also
 * hard-disables the endpoints it calls outside non-production environments, so this is
 * disabled twice over and cannot leak into a real deployment.
 */
export function DevMerchantSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const router = useRouter();

  const { data: merchants = [], isLoading } = useGetDevMerchantsQuery(undefined, {
    skip: !DEV_LOGIN_ENABLED || !isOpen,
  });
  const [devLoginAs, { isLoading: isLoggingIn }] = useDevLoginAsMutation();

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!DEV_LOGIN_ENABLED) return null;

  const handleSelect = async (userId: string, fullName: string) => {
    try {
      const response = await devLoginAs({ userId }).unwrap();
      dispatch(
        setCredentials({
          user: response.user,
          token: response.accessToken,
          refreshToken: response.refreshToken,
        })
      );
      toast.success(`Dev switcher: logged in as ${fullName}`);
      setIsOpen(false);
      router.replace('/dashboard');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Could not log in as this merchant.');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 h-9 px-3 rounded-full border border-dashed border-amber-400 bg-amber-50 text-[12px] font-bold text-amber-700 hover:bg-amber-100 transition-colors"
      >
        <Wrench className="w-3.5 h-3.5" />
        Dev: Log in as Merchant
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 bg-white border border-amber-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            Non-production only
          </div>
          <div className="max-h-72 overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-[12.5px] text-slate-400 font-medium text-center">Loading merchants…</div>
            )}
            {!isLoading && merchants.length === 0 && (
              <div className="p-4 text-[12.5px] text-slate-400 font-medium text-center">No merchant accounts found.</div>
            )}
            {merchants.map((merchant) => (
              <button
                key={merchant.userId}
                type="button"
                disabled={isLoggingIn}
                onClick={() => handleSelect(merchant.userId, merchant.fullName)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 truncate">{merchant.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {merchant.email}
                    {merchant.stores[0] ? ` · ${merchant.stores[0].name}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
