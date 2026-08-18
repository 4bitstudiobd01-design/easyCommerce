'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/features/auth/slices/authSlice';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronRight,
  Store,
  Settings,
  CreditCard,
  UserCheck,
  LogOut,
} from 'lucide-react';

const USER_MENU_ITEMS = [
  { label: 'My Stores', icon: Store, href: '/dashboard' },
  { label: 'Account Settings', icon: Settings, href: '/dashboard/settings' },
  { label: 'Billing & Subscription', icon: CreditCard, href: '/dashboard/settings/billing' },
  { label: 'Team Members', icon: UserCheck, href: '/dashboard/staff' },
];

export function UserProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully.');
    setIsOpen(false);
    router.push('/login');
  };

  // Compute 2-letter uppercase initials (e.g., "MD Belal Hossain" -> "MB")
  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'MB';

  const displayName = user?.fullName || 'MD Belal Hossain';
  const displayEmail = user?.email || 'belal@bitcommerce.app';

  return (
    <div
      ref={dropdownRef}
      className="relative py-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Outer Profile Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all text-left cursor-pointer focus:outline-none shadow-2xs group select-none"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:bg-blue-700 transition-colors">
          {userInitials}
        </div>
        <div className="hidden sm:block min-w-0 pr-1 leading-tight">
          <p className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
            {displayName}
          </p>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5">
            Merchant
          </p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Card with Hover Bridge */}
      {isOpen && (
        <div
          className="absolute right-0 top-full pt-2 w-72 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-3.5">
            
            {/* Header Profile Section */}
            <div className="flex items-center gap-3 p-2.5 pb-3.5 border-b border-slate-100">
              <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {displayName}
                  </p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    Merchant
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                  {displayEmail}
                </p>
              </div>
            </div>

            {/* Menu Links */}
            <div className="py-2 space-y-0.5">
              {USER_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </Link>
                );
              })}
            </div>

            {/* Logout Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Log Out</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
