'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
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
  Boxes,
  Palette,
  KeySquare,
  Building2,
  Mail,
  HelpCircle,
  User as UserIcon,
  Truck,
  Wallet,
  LineChart,
  Tag,
  Menu,
  X,
  LucideIcon,
} from 'lucide-react';

interface MenuItem {
  href: string;
  icon: LucideIcon;
  color: string;
  title: string;
  desc: string;
}

const PLATFORM_FEATURES: MenuItem[] = [
  {
    href: '/#features',
    icon: KeySquare,
    color: 'blue',
    title: 'Multi-Tenant Isolation',
    desc: 'Your store\'s data stays yours — fully isolated from every other merchant.',
  },
  {
    href: '/#features',
    icon: Palette,
    color: 'emerald',
    title: 'Zero-Code Customizer',
    desc: 'Responsive theme builder — no developer needed.',
  },
  {
    href: '/#features',
    icon: Boxes,
    color: 'indigo',
    title: 'Decoupled Inventory',
    desc: 'Multi-warehouse stock control, separate from your catalog.',
  },
];

const CHECKOUT_FULFILLMENT: MenuItem[] = [
  {
    href: '/#features',
    icon: Wallet,
    color: 'pink',
    title: 'bKash, Nagad & Cards',
    desc: 'SSLCommerz-powered checkout with local MFS support.',
  },
  {
    href: '/#features',
    icon: Truck,
    color: 'amber',
    title: 'Steadfast & Pathao Courier',
    desc: 'One-click parcel booking straight from your order panel.',
  },
  {
    href: '/#features',
    icon: LineChart,
    color: 'purple',
    title: 'Live Sales Analytics',
    desc: 'Revenue, top products, and order trends in one dashboard.',
  },
];

const COMPANY_LINKS = [
  { href: '/about', icon: Building2, color: 'blue', label: 'About Us' },
  { href: '/contact', icon: Mail, color: 'emerald', label: 'Contact Us' },
  { href: '/#faq', icon: HelpCircle, color: 'indigo', label: 'FAQ' },
  { href: '/#pricing', icon: Tag, color: 'purple', label: 'Pricing' },
];

// Static class lookup — Tailwind needs full literal class names to detect them at build time.
const ICON_STYLES: Record<string, { bg: string; text: string; hoverBg: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hoverBg: 'group-hover:bg-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hoverBg: 'group-hover:bg-indigo-600' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', hoverBg: 'group-hover:bg-pink-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', hoverBg: 'group-hover:bg-amber-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hoverBg: 'group-hover:bg-purple-600' },
};

function MenuLinkItem({ item, onClick, interactive = true }: { item: MenuItem; onClick: () => void; interactive?: boolean }) {
  const style = ICON_STYLES[item.color];
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 ${interactive ? 'group' : ''} block`}
    >
      <div className={`p-2 rounded-lg mt-0.5 shrink-0 transition-colors ${style.bg} ${style.text} ${interactive ? `${style.hoverBg} group-hover:text-white` : ''}`}>
        <item.icon className="w-4 h-4" />
      </div>
      <div>
        <span className={`font-bold text-slate-900 text-xs block transition-colors ${interactive ? 'group-hover:text-blue-600' : ''}`}>
          {item.title}
        </span>
        <span className="text-[11px] text-slate-500 block leading-tight">{item.desc}</span>
      </div>
    </Link>
  );
}

export function Navbar() {
  const [activeMenu, setActiveMenu] = useState<'features' | 'company' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Close the mobile drawer on desktop resize so it never gets stuck open.
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully.');
    setIsMobileMenuOpen(false);
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

        {/* Desktop Navigation Links */}
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
                  {PLATFORM_FEATURES.map((item) => (
                    <MenuLinkItem key={item.title} item={item} onClick={() => setActiveMenu(null)} />
                  ))}
                </div>

                {/* Column 2: Checkout & Fulfillment */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-3">
                    Checkout & Fulfillment
                  </span>
                  {CHECKOUT_FULFILLMENT.map((item) => (
                    <MenuLinkItem key={item.title} item={item} onClick={() => setActiveMenu(null)} />
                  ))}
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
                {COMPANY_LINKS.map((item) => {
                  const style = ICON_STYLES[item.color];
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setActiveMenu(null)}
                      className="p-2.5 rounded-lg hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <item.icon className={`w-4 h-4 ${style.text}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {mounted && isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-2 transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-600" />
                <span>Control Panel</span>
              </Link>

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

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          className="md:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-6 py-5 space-y-6 max-h-[calc(100vh-64px)] overflow-y-auto">
            {/* Platform features */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Core Platform
              </span>
              {PLATFORM_FEATURES.map((item) => (
                <MenuLinkItem key={item.title} item={item} onClick={() => setIsMobileMenuOpen(false)} interactive={false} />
              ))}
            </div>

            {/* Checkout & fulfillment */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Checkout & Fulfillment
              </span>
              {CHECKOUT_FULFILLMENT.map((item) => (
                <MenuLinkItem key={item.title} item={item} onClick={() => setIsMobileMenuOpen(false)} interactive={false} />
              ))}
            </div>

            {/* Company links */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              {COMPANY_LINKS.map((item) => {
                const style = ICON_STYLES[item.color];
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2.5 rounded-lg hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <item.icon className={`w-4 h-4 ${style.text}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Auth actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              {mounted && isAuthenticated && user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-4 py-3 bg-blue-50 text-blue-700 font-bold text-sm rounded-xl border border-blue-200 flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Control Panel</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-red-600 font-bold text-sm rounded-xl border border-red-200 bg-red-50 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out ({user.fullName || user.email})</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-4 py-3 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    <span>Launch Store</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
