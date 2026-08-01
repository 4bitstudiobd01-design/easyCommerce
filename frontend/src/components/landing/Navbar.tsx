'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/features/auth/slices/authSlice';
import {
  Store,
  ArrowRight,
  LogIn,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Layers,
  Palette,
  ShieldCheck,
  Building2,
  Mail,
  HelpCircle,
  User as UserIcon,
} from 'lucide-react';

export function Navbar() {
  const [activeMenu, setActiveMenu] = useState<'features' | 'company' | null>(null);
  const [mounted, setMounted] = useState(false);

  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Clean Logo Branding */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-700 transition-colors">
            <Store className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">EasyCommerce</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase border border-blue-100">
              SaaS
            </span>
          </div>
        </Link>

        {/* Clean Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700 relative">
          {/* 1. Unified Features & Ecosystem Mega Menu */}
          <div
            className="relative py-2"
            onMouseEnter={() => setActiveMenu('features')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors py-1">
              <span>Features</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  activeMenu === 'features' ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>

            {/* Features Mega Menu Dropdown */}
            {activeMenu === 'features' && (
              <div className="absolute top-full -left-20 w-[640px] p-6 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 grid grid-cols-2 gap-6 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Column 1: Core Platform */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3">
                    Core Platform
                  </span>
                  <Link
                    href="/#features"
                    onClick={() => setActiveMenu(null)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 group block"
                  >
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block group-hover:text-blue-600 transition-colors">
                        Multi-Tenant Isolation
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        Row-level security context.
                      </span>
                    </div>
                  </Link>

                  <Link
                    href="/#features"
                    onClick={() => setActiveMenu(null)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 group block"
                  >
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors mt-0.5">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block group-hover:text-blue-600 transition-colors">
                        Zero-Code Customizer
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        Responsive theme builder.
                      </span>
                    </div>
                  </Link>

                  <Link
                    href="/#features"
                    onClick={() => setActiveMenu(null)}
                    className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 group block"
                  >
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-xs block group-hover:text-blue-600 transition-colors">
                        Decoupled Inventory
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        Multi-warehouse stock control.
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 2. Pricing Link */}
          <Link href="/#pricing" className="hover:text-blue-600 transition-colors">
            Pricing
          </Link>

          {/* 3. Company Dropdown */}
          <div
            className="relative py-2"
            onMouseEnter={() => setActiveMenu('company')}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors py-1">
              <span>Company</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  activeMenu === 'company' ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>

            {/* Company Dropdown Menu */}
            {activeMenu === 'company' && (
              <div className="absolute top-full left-0 w-48 p-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 text-left animate-in fade-in slide-in-from-top-2 duration-200 space-y-1">
                <Link
                  href="/about"
                  onClick={() => setActiveMenu(null)}
                  className="p-2.5 rounded-lg hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center gap-2 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>About Us</span>
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setActiveMenu(null)}
                  className="p-2.5 rounded-lg hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span>Contact Us</span>
                </Link>
                <Link
                  href="/#faq"
                  onClick={() => setActiveMenu(null)}
                  className="p-2.5 rounded-lg hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center gap-2 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>FAQ</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Clean Dynamic Action Buttons (Logged In vs Logged Out) */}
        <div className="flex items-center gap-3 shrink-0">
          {mounted && isAuthenticated && user ? (
            <>
              {/* Dashboard Button */}
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-2 transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-600" />
                <span>Control Panel</span>
              </Link>

              {/* User Badge / Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="max-w-[120px] truncate">{user.fullName || user.email}</span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-slate-700 hover:text-blue-600 font-semibold text-sm flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/register"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <span>Launch Store</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
