'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  ExternalLink,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
}

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast.info(`Searching platform for: "${searchQuery}"`);
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/90 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left Area: Toggle & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        {/* Toggle Button */}
        <button
          type="button"
          id="header-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search merchants by name, email, phone or domain..."
              className="w-full pl-9 pr-14 py-2 bg-gray-50/80 hover:bg-gray-100/80 focus:bg-white border border-gray-200 focus:border-emerald-500 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <div className="absolute right-2.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-semibold text-gray-400 pointer-events-none shadow-2xs">
              <span>⌘</span>
              <span>K</span>
            </div>
          </div>
        </form>
      </div>

      {/* Right Area: Visit Platform, Notifications, User Profile */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Visit Platform Button */}
        <Link
          href="/dashboard"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-50/50 rounded-xl text-xs font-semibold text-emerald-700 shadow-2xs transition-all"
        >
          <span>Visit Platform</span>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
        </Link>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <Link
            href="/admin/notifications"
            className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors block"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute 1 top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              8
            </span>
          </Link>
        </div>

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        {/* User Profile Avatar & Details */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            {/* Dark green badge with initials PA */}
            <div className="w-9 h-9 rounded-full bg-emerald-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              PA
            </div>

            <div className="hidden lg:block leading-tight">
              <span className="text-xs font-bold text-gray-900 block">Platform Admin</span>
              <span className="text-[11px] text-gray-400 block font-normal">
                superadmin@easyco.com
              </span>
            </div>

            <ChevronDown className="w-4 h-4 text-gray-400 hidden lg:block" />
          </button>

          {isProfileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsProfileMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900">Platform Admin</p>
                  <p className="text-[11px] text-gray-400 truncate">superadmin@easyco.com</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/admin/users"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/admin/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Platform Settings</span>
                  </Link>

                  <Link
                    href="/admin/security"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Security & 2FA</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      toast.success('Logged out successfully');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
