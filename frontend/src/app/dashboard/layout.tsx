'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/features/dashboard/components/Sidebar';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { Toaster } from 'sonner';
import { ConnectionStatusBanner } from '@/components/ui/ConnectionStatusBanner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  const {
    data: store,
    isLoading: isStoreLoading,
    isFetching: isStoreFetching,
    isSuccess: isStoreSuccess,
  } = useGetMyStoreQuery(undefined, { skip: !isAuthenticated });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!token && !isAuthenticated) {
      router.push('/login');
    }
  }, [token, isAuthenticated, router]);

  // Onboarding logic: if user has no store, force them to create-store page
  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN' && isStoreSuccess && !isStoreLoading && !isStoreFetching && !store) {
      if (pathname !== '/dashboard/create-store') {
        router.push('/dashboard/create-store');
      }
    }
  }, [user, isStoreSuccess, isStoreLoading, isStoreFetching, store, pathname, router]);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // Prevent hydration mismatch before the client knows the auth state.
  if (!isMounted) return null;

  // Session ended (expired refresh token, or explicit logout). The redirect above is
  // already running; show a short message instead of a blank page so the screen never
  // looks like "your store has no data".
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-sm">
          <h2 className="text-base font-extrabold text-slate-900">Your session has ended</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Please sign in again to continue managing your store.
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(true);
    } else {
      setIsDesktopCollapsed(!isDesktopCollapsed);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex font-sans">
      <Toaster position="top-right" richColors />
      
      {/* 1. Left Sidebar Navigation */}
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        isDesktopCollapsed={isDesktopCollapsed} 
        onClose={() => setIsMobileOpen(false)} 
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Sticky Header */}
        <DashboardHeader onMenuClick={handleMenuClick} />

        <ConnectionStatusBanner />

        {/* Dashboard Body Container */}
        <main className="flex-1 w-full flex flex-col px-5 md:px-10 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
