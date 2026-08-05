'use client';

import React, { useState, ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { DashboardToolbar } from './DashboardToolbar';
import { DashboardFilterProvider } from '../../context/DashboardFilterContext';

export interface DashboardShellProps {
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
  children: ReactNode;
}

export function DashboardShell({
  userName,
  userEmail,
  onLogout,
  onRefreshAll,
  isRefreshing = false,
  children,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <DashboardFilterProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans antialiased selection:bg-blue-600 selection:text-white">
        {/* Left Sidebar */}
        <DashboardSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Operational Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <DashboardHeader
            userName={userName}
            userEmail={userEmail}
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onLogout={onLogout}
          />

          {/* Sticky Toolbar */}
          <DashboardToolbar onRefreshAll={onRefreshAll} isRefreshing={isRefreshing} />

          {/* Main Content Viewport */}
          <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </DashboardFilterProvider>
  );
}
