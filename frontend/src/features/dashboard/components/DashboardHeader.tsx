'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {
  Search,
  ExternalLink,
  Menu,
  ChevronDown,
  Settings,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { NotificationBellDrawer } from '@/features/sms/components/NotificationBellDrawer';
import { logout } from '@/features/auth/slices/authSlice';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: store } = useGetMyStoreQuery();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Hamburger + Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={onMenuClick}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-xs hidden sm:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-9 pr-12 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-400 shadow-sm">
              ⌘ K
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Visit Store button */}
        {store && (
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Visit Store</span>
          </Link>
        )}

        {/* Notification bell */}
        <NotificationBellDrawer />

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* User Profile */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 hover:bg-slate-50 p-1.5 rounded-lg transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'M'}
            </div>
            <div className="hidden md:block min-w-0">
              <p className="text-[13px] font-bold text-slate-800 leading-tight">
                {user?.fullName || 'Merchant Account'}
              </p>
              <p className="text-[11px] font-medium text-slate-500 leading-tight">
                Merchant
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[13px] font-bold text-slate-800 truncate">
                  {user?.fullName || 'Merchant Account'}
                </p>
                <p className="text-[11px] font-medium text-slate-500 truncate">
                  {user?.email || 'Merchant'}
                </p>
              </div>
              <div className="p-1.5">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Store Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
