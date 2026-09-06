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
import { DockedChatManager } from '@/features/crm/components/omnichannel/DockedChatManager';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [storeResolveTimeout, setStoreResolveTimeout] = useState(false);

  const {
    data: store,
    isLoading: isStoreLoading,
    isFetching: isStoreFetching,
    isSuccess: isStoreSuccess,
  } = useGetMyStoreQuery(undefined, { skip: !isAuthenticated });

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('bitcommerce_sidebar_collapsed');
    if (saved !== null) {
      setIsDesktopCollapsed(saved === 'true');
    }
  }, []);

  // Safety fallback: ensure dashboard never hangs infinitely waiting for store resolution
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => setStoreResolveTimeout(true), 3500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // If not authenticated, redirect directly to /login
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      window.location.replace('/login');
    }
  }, [isMounted, isAuthenticated]);

  // Onboarding logic: if user has no store, force them to create-store page
  useEffect(() => {
    if (
      user?.role !== 'SUPER_ADMIN' &&
      isStoreSuccess &&
      !isStoreLoading &&
      !isStoreFetching &&
      !store
    ) {
      if (pathname !== '/dashboard/create-store') {
        router.push('/dashboard/create-store');
      }
    }
  }, [user, isStoreSuccess, isStoreLoading, isStoreFetching, store, pathname, router]);

  const handleToggleDesktopCollapse = () => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('bitcommerce_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(true);
    } else {
      handleToggleDesktopCollapse();
    }
  };

  const isResolvingStore =
    !storeResolveTimeout && user?.role !== 'SUPER_ADMIN' && isAuthenticated && isStoreLoading;
  const isRedirectingToOnboarding =
    user?.role !== 'SUPER_ADMIN' && isStoreSuccess && !store && pathname !== '/dashboard/create-store';

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Redirecting to login...</p>
        <a
          href="/login"
          className="text-xs text-blue-600 font-bold underline hover:text-blue-700"
        >
          Click here if not redirected automatically
        </a>
      </div>
    );
  }

  if (isResolvingStore || isRedirectingToOnboarding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex font-sans">
      <Toaster position="top-right" richColors />
      
      {/* 1. Left Sidebar Navigation */}
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        isDesktopCollapsed={isDesktopCollapsed} 
        onClose={() => setIsMobileOpen(false)}
        onToggleCollapse={handleToggleDesktopCollapse}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        {/* Top Sticky Header */}
        <DashboardHeader 
          onMenuClick={handleMenuClick} 
          isDesktopCollapsed={isDesktopCollapsed}
        />

        <ConnectionStatusBanner />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* 3. Messenger-Style Floating Bottom Chat Dock */}
      <DockedChatManager />
    </div>
  );
}
