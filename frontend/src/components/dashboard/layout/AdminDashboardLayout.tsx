'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Toaster } from 'sonner';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

export function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  // Sidebar is collapsed by default per user requirement
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="h-screen w-full flex bg-[#F8FAFC] text-slate-900 font-sans antialiased overflow-hidden">
      <Toaster position="top-right" richColors />

      {/* Mobile Backdrop Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* 1. Fixed / Pinned Sidebar Navigation */}
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileDrawerOpen}
        onToggleCollapse={handleToggleCollapse}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
      />

      {/* 2. Main Content Area (Independently Scrollable on Right) */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Fixed Top Header */}
        <AdminHeader onToggleSidebar={handleToggleCollapse} />

        {/* Scrollable Main Content Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-7 2xl:p-8 space-y-5 sm:space-y-6 max-w-[1700px] w-full mx-auto scrollbar-thin scrollbar-thumb-slate-200">
          {children}
        </main>
      </div>
    </div>
  );
}
