'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/features/auth/slices/authSlice';
import { UserProfileMenu } from '@/features/auth/components/UserProfileMenu';
import {
  ShoppingBag,
  Package,
  CreditCard,
  Truck,
  Users,
  Megaphone,
  Palette,
  BarChart2,
  Puzzle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  BookOpen,
  HelpCircle,
  FileText,
  MessageSquare,
  Store,
  Rocket,
  Building2,
  ShoppingBasket,
  MapPin,
  LogOut,
  Menu,
  X,
  Layers,
} from 'lucide-react';

/* =======================================================================
   DATA SPECIFICATIONS (100% MATCHING REFERENCE UI)
======================================================================= */

// --- 1. FEATURES MEGA MENU ITEMS (10 Items) ---
const FEATURES_DATA = [
  {
    id: 'products-catalog',
    title: 'Products & Catalog',
    desc: 'Manage products, categories, variants and inventory',
    icon: ShoppingBag,
    iconBg: 'bg-blue-50 text-blue-600',
    href: '/#features',
  },
  {
    id: 'orders-management',
    title: 'Orders Management',
    desc: 'Process orders and manage fulfillment',
    icon: Package,
    iconBg: 'bg-emerald-50 text-emerald-600',
    href: '/#features',
  },
  {
    id: 'payments',
    title: 'Payments',
    desc: 'Accept payments and manage transactions',
    icon: CreditCard,
    iconBg: 'bg-purple-50 text-purple-600',
    href: '/#integrations',
  },
  {
    id: 'courier-delivery',
    title: 'Courier & Delivery',
    desc: 'Ship orders and track deliveries',
    icon: Truck,
    iconBg: 'bg-orange-50 text-orange-600',
    href: '/#integrations',
  },
  {
    id: 'customers',
    title: 'Customers',
    desc: 'Manage customers and relationships',
    icon: Users,
    iconBg: 'bg-indigo-50 text-indigo-600',
    href: '/#features',
  },
  {
    id: 'marketing-tools',
    title: 'Marketing Tools',
    desc: 'Run campaigns and recover abandoned carts',
    icon: Megaphone,
    iconBg: 'bg-sky-50 text-sky-600',
    href: '/#features',
  },
  {
    id: 'storefront-themes',
    title: 'Storefront & Themes',
    desc: 'Customize your store and pages',
    icon: Palette,
    iconBg: 'bg-amber-50 text-amber-600',
    href: '/#features',
  },
  {
    id: 'analytics-reports',
    title: 'Analytics & Reports',
    desc: 'Track performance and grow your business',
    icon: BarChart2,
    iconBg: 'bg-teal-50 text-teal-600',
    href: '/#dashboard',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    desc: 'Connect third-party apps and services',
    icon: Puzzle,
    iconBg: 'bg-violet-50 text-violet-600',
    href: '/#integrations',
  },
  {
    id: 'all-features',
    title: 'All Features',
    desc: 'Explore everything BitCommerce offers',
    icon: Sparkles,
    iconBg: 'bg-blue-50 text-blue-600',
    href: '/#features',
  },
];

// --- 2. SOLUTIONS ITEMS (5 Items) ---
const SOLUTIONS_DATA = [
  {
    id: 'small-business',
    title: 'For Small Businesses',
    desc: 'Start and grow your online business',
    icon: Store,
    iconBg: 'bg-blue-50 text-blue-600',
    href: '/#solutions',
  },
  {
    id: 'growing-brands',
    title: 'For Growing Brands',
    desc: 'Scale operations and increase sales',
    icon: Rocket,
    iconBg: 'bg-orange-50 text-orange-600',
    href: '/#solutions',
  },
  {
    id: 'enterprises',
    title: 'For Enterprises',
    desc: 'Advanced control and custom solutions',
    icon: Building2,
    iconBg: 'bg-amber-50 text-amber-600',
    href: '/#solutions',
  },
  {
    id: 'multi-vendor',
    title: 'Multi-Vendor Marketplace',
    desc: 'Build your own marketplace platform',
    icon: ShoppingBasket,
    iconBg: 'bg-teal-50 text-teal-600',
    href: '/#solutions',
  },
  {
    id: 'local-business',
    title: 'Local Business',
    desc: 'Perfect for local sellers and retailers',
    icon: MapPin,
    iconBg: 'bg-blue-50 text-blue-600',
    href: '/#solutions',
  },
];

/**
 * --- 3. RESOURCES ITEMS ---
 * Only destinations that genuinely exist. Documentation, API Reference and
 * Video Tutorials were removed rather than pointed at a placeholder page —
 * add them back when there is real content behind them.
 */
const RESOURCES_DATA = [
  {
    id: 'blog',
    title: 'Blog',
    desc: 'Latest updates and business tips',
    icon: FileText,
    iconBg: 'bg-indigo-50 text-indigo-600',
    href: '/blog',
  },
  {
    id: 'help-center',
    title: 'Help Center',
    desc: 'Get help with your questions',
    icon: HelpCircle,
    iconBg: 'bg-sky-50 text-sky-600',
    href: '/contact',
  },
  {
    id: 'community',
    title: 'Community',
    desc: 'Join our community and discussions',
    icon: MessageSquare,
    iconBg: 'bg-amber-50 text-amber-600',
    href: '/contact',
  },
];

type DropdownMenu = 'features' | 'solutions' | 'resources';

export function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState<DropdownMenu | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<DropdownMenu | null>(null);
  const [mounted, setMounted] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear any pending hover-close timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Close menus on Escape so keyboard users are not trapped
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setActiveDropdown(null);
      setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Lock background scroll while the mobile drawer is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const handleMouseEnter = (menu: DropdownMenu) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 250);
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully.');
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  };

  return (
    <header ref={navRef} className="w-full bg-white border-b border-slate-100 sticky top-0 z-50 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* =======================================================================
            1. BRAND LOGO
        ======================================================================= */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shadow-blue-500/30 group-hover:bg-blue-700 transition-colors">
            <ShoppingBag className="w-4.5 h-4.5" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            BitCommerce
          </span>
        </Link>

        {/* =======================================================================
            2. DESKTOP NAVIGATION (MD & ABOVE)
        ======================================================================= */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-semibold text-slate-700">
          
          {/* --- 1. FEATURES DROPDOWN --- */}
          <div
            className="relative py-4"
            onMouseEnter={() => handleMouseEnter('features')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'features' ? null : 'features')}
              aria-expanded={activeDropdown === 'features'}
              aria-haspopup="true"
              className={`flex items-center gap-1 transition-colors py-1 cursor-pointer select-none ${
                activeDropdown === 'features' ? 'text-blue-600 font-bold' : 'hover:text-blue-600'
              }`}
            >
              <span>Features</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'features' ? 'rotate-180 text-blue-600' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Indicator Blue Pip */}
            {activeDropdown === 'features' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-blue-600 z-50" />
            )}

            {/* Dropdown Menu Container */}
            {activeDropdown === 'features' && (
              <div
                className="absolute top-full -left-20 sm:-left-28 w-[680px] lg:w-[740px] pt-2 z-50"
                onMouseEnter={() => handleMouseEnter('features')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {FEATURES_DATA.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-start gap-3.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Bottom Link */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
                    <Link
                      href="/#features"
                      onClick={() => setActiveDropdown(null)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors group"
                    >
                      <span>View All Features</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- 2. SOLUTIONS DROPDOWN --- */}
          <div
            className="relative py-4"
            onMouseEnter={() => handleMouseEnter('solutions')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'solutions' ? null : 'solutions')}
              aria-expanded={activeDropdown === 'solutions'}
              aria-haspopup="true"
              className={`flex items-center gap-1 transition-colors py-1 cursor-pointer select-none ${
                activeDropdown === 'solutions' ? 'text-blue-600 font-bold' : 'hover:text-blue-600'
              }`}
            >
              <span>Solutions</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'solutions' ? 'rotate-180 text-blue-600' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Indicator Blue Pip */}
            {activeDropdown === 'solutions' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-blue-600 z-50" />
            )}

            {/* Dropdown Menu Container */}
            {activeDropdown === 'solutions' && (
              <div
                className="absolute top-full -left-12 w-[420px] pt-2 z-50"
                onMouseEnter={() => handleMouseEnter('solutions')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="space-y-1.5">
                    {SOLUTIONS_DATA.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-start gap-3.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Bottom Link */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
                    <Link
                      href="/#solutions"
                      onClick={() => setActiveDropdown(null)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors group"
                    >
                      <span>View All Solutions</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- 3. PRICING LINK --- */}
          <Link
            href="/#pricing"
            className="hover:text-blue-600 transition-colors py-1 cursor-pointer"
          >
            Pricing
          </Link>

          {/* --- 4. RESOURCES DROPDOWN --- */}
          <div
            className="relative py-4"
            onMouseEnter={() => handleMouseEnter('resources')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
              aria-expanded={activeDropdown === 'resources'}
              aria-haspopup="true"
              className={`flex items-center gap-1 transition-colors py-1 cursor-pointer select-none ${
                activeDropdown === 'resources' ? 'text-blue-600 font-bold' : 'hover:text-blue-600'
              }`}
            >
              <span>Resources</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  activeDropdown === 'resources' ? 'rotate-180 text-blue-600' : 'text-slate-400'
                }`}
              />
            </button>

            {/* Indicator Blue Pip */}
            {activeDropdown === 'resources' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-blue-600 z-50" />
            )}

            {/* Dropdown Menu Container */}
            {activeDropdown === 'resources' && (
              <div
                className="absolute top-full -left-16 w-[420px] pt-2 z-50"
                onMouseEnter={() => handleMouseEnter('resources')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="space-y-1.5">
                    {RESOURCES_DATA.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-start gap-3.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Bottom Link */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
                    <Link
                      href="/#faq"
                      onClick={() => setActiveDropdown(null)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors group"
                    >
                      <span>View All Resources</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- 5. CHANGELOG LINK --- */}
          <Link
            href="/changelog"
            className="hover:text-blue-600 transition-colors py-1 cursor-pointer"
          >
            Changelog
          </Link>
        </nav>

        {/* =======================================================================
            3. RIGHT AUTH & USER ACTIONS
        ======================================================================= */}
        <div className="hidden md:flex items-center gap-3">
          {mounted && isAuthenticated && user ? (
            <UserProfileMenu />
          ) : (
            /* --- LOGGED OUT AUTH BUTTONS --- */
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xs shadow-blue-600/25 transition-all active:scale-98"
              >
                Start Free
              </Link>
            </>
          )}
        </div>

        {/* =======================================================================
            4. MOBILE HAMBURGER BUTTON (BELOW MD)
        ======================================================================= */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Toggle Navigation Menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* =======================================================================
          5. MOBILE APP DRAWER / BOTTOM SHEET
      ======================================================================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200/90 bg-white/95 backdrop-blur-xl px-5 py-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-4 duration-200 shadow-2xl rounded-b-3xl">
          
          {/* iOS-Style Sheet Drag Handle */}
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

          {/* Features Accordion */}
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <button
              type="button"
              onClick={() =>
                setMobileExpandedSection(mobileExpandedSection === 'features' ? null : 'features')
              }
              aria-expanded={mobileExpandedSection === 'features'}
              className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Features & Capabilities</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  mobileExpandedSection === 'features' ? 'rotate-90 text-blue-600' : ''
                }`}
              />
            </button>
            {mobileExpandedSection === 'features' && (
              <div className="grid grid-cols-1 gap-1.5 pt-3 border-t border-slate-200/60 mt-3">
                {FEATURES_DATA.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs text-slate-700 font-semibold hover:bg-white hover:text-blue-600 transition-colors active:scale-[0.98]"
                  >
                    <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Solutions Accordion */}
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <button
              type="button"
              onClick={() =>
                setMobileExpandedSection(mobileExpandedSection === 'solutions' ? null : 'solutions')
              }
              aria-expanded={mobileExpandedSection === 'solutions'}
              className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                <span>Business Solutions</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  mobileExpandedSection === 'solutions' ? 'rotate-90 text-blue-600' : ''
                }`}
              />
            </button>
            {mobileExpandedSection === 'solutions' && (
              <div className="grid grid-cols-1 gap-1.5 pt-3 border-t border-slate-200/60 mt-3">
                {SOLUTIONS_DATA.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs text-slate-700 font-semibold hover:bg-white hover:text-blue-600 transition-colors active:scale-[0.98]"
                  >
                    <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Direct Links (Pricing & Changelog) */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900 active:scale-[0.98] transition-all"
            >
              <span>Pricing Plans</span>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/changelog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900 active:scale-[0.98] transition-all"
            >
              <span>Changelog</span>
              <Sparkles className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Resources Accordion */}
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <button
              type="button"
              onClick={() =>
                setMobileExpandedSection(mobileExpandedSection === 'resources' ? null : 'resources')
              }
              aria-expanded={mobileExpandedSection === 'resources'}
              className="w-full flex items-center justify-between text-xs font-extrabold text-slate-900 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Resources & Support</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  mobileExpandedSection === 'resources' ? 'rotate-90 text-blue-600' : ''
                }`}
              />
            </button>
            {mobileExpandedSection === 'resources' && (
              <div className="grid grid-cols-1 gap-1.5 pt-3 border-t border-slate-200/60 mt-3">
                {RESOURCES_DATA.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs text-slate-700 font-semibold hover:bg-white hover:text-blue-600 transition-colors active:scale-[0.98]"
                  >
                    <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Auth Buttons */}
          <div className="pt-2 space-y-2">
            {mounted && isAuthenticated && user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all"
                >
                  <Store className="w-4 h-4" />
                  <span>Open Merchant Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 bg-red-50 text-red-600 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 border border-red-200 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out ({user.fullName || user.email})</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-3 px-4 text-slate-900 bg-white border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center active:scale-[0.98] transition-all shadow-xs"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-3 px-4 text-white bg-blue-600 rounded-2xl font-bold text-xs flex items-center justify-center hover:bg-blue-700 shadow-md shadow-blue-600/25 active:scale-[0.98] transition-all"
                >
                  Start Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
