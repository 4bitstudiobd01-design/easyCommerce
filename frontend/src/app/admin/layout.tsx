'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/features/admin/components/layout/AdminSidebar';
import { AdminHeader } from '@/features/admin/components/layout/AdminHeader';
import { Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!token && !isAuthenticated) {
      router.push('/login');
    }
  }, [token, isAuthenticated, router]);

  if (!isMounted || (!token && !isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex font-sans">
      <Toaster position="top-right" richColors />

      {/* 1. Left Sidebar Navigation */}
      <AdminSidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <AdminHeader />

        {/* Dashboard Main Content Body */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
