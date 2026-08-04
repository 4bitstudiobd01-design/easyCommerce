'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/features/dashboard/components/Sidebar';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { Toaster } from 'sonner';

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Prevent hydration mismatch and hide content until authenticated
  if (!isMounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-900/5 text-slate-900 flex font-sans">
      <Toaster position="top-right" richColors />
      
      {/* 1. Left Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Sticky Header */}
        <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Dashboard Body Container */}
        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
