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

  // While the *initial* store lookup is in flight, hold off on rendering dashboard
  // content: otherwise the page briefly paints with no-store data before the
  // onboarding redirect (or the real store data) resolves, which reads as an
  // unwanted flash toward "create your store" right after registering. Only the
  // first lookup is gated (isLoading) — later background refetches (isFetching)
  // must not re-trigger this, or every store-data refresh would blank the page.
  const isResolvingStore = user?.role !== 'SUPER_ADMIN' && isAuthenticated && isStoreLoading;
  const isRedirectingToOnboarding =
    user?.role !== 'SUPER_ADMIN' && isStoreSuccess && !store && pathname !== '/dashboard/create-store';

  // Not mounted (hydration guard), still resolving the store, redirecting to onboarding,
  // or unauthenticated (session ended / mid-logout, redirect to /login already in flight
  // via the effect above) all render the same spinner so the transition reads as one
  // continuous loading state instead of a blank flash or a distinct "other page".
  if (!isMounted || isResolvingStore || isRedirectingToOnboarding || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
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
