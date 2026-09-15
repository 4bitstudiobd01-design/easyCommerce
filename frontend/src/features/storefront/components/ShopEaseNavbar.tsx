import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  User,
  ChevronDown,
  Menu,
  X,
  Heart,
  Package,
  LogOut,
  Sparkles,
  UserPlus,
  LogIn,
  UserCircle,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { toggleCartDrawer } from '../slices/cartSlice';
import { customerLogout } from '../slices/customerAuthSlice';
import { CustomerAuthModal } from './CustomerAuthModal';
import { toast } from 'sonner';

interface ShopEaseNavbarProps {
  storeName?: string;
  slug?: string;
  logo?: string;
  primaryColor?: string;
  category?: string;
  categories?: string[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeTab?: 'home' | 'shop' | 'categories' | 'contact';
}

export const ShopEaseNavbar = ({
  storeName = 'ShopEase',
  slug = 'main',
  logo,
  primaryColor = '#2563eb',
  category,
  categories = [],
  selectedCategory = 'ALL',
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
  activeTab = 'home',
}: ShopEaseNavbarProps) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.price || (item as any).basePrice || 0) * item.quantity,
    0
  );

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Customer Auth state — sourced from Redux/ec_customer_* storage (see
  // customerAuthSlice.ts), not a local-only copy, so it stays in sync with
  // anything that updates the session (login, logout, profile edits).
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);
  const [customerAuthMode, setCustomerAuthMode] = useState<'login' | 'register'>('login');
  const customerAuthState = useSelector((state: RootState) => state.customerAuth);
  const customer = customerAuthState.isAuthenticated && customerAuthState.customer
    ? {
        name: `${customerAuthState.customer.firstName || ''} ${customerAuthState.customer.lastName || ''}`.trim() || customerAuthState.customer.email,
        email: customerAuthState.customer.email,
        phone: customerAuthState.customer.phone,
      }
    : null;

  const handleOpenCustomerAuth = (mode: 'login' | 'register') => {
    setCustomerAuthMode(mode);
    setIsCustomerAuthOpen(true);
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleCustomerLogout = () => {
    dispatch(customerLogout());
    setIsAccountMenuOpen(false);
    toast.success('You have been signed out.');
  };

  const displayCount = totalItemCount;
  const displaySubtotal = `৳${subtotal.toLocaleString('en-US')}`;

  return (
    <>
      <CustomerAuthModal
        isOpen={isCustomerAuthOpen}
        onClose={() => setIsCustomerAuthOpen(false)}
        storeName={storeName}
        storeSlug={slug}
        primaryColor={primaryColor}
        initialMode={customerAuthMode}
      />

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs transition-all">
        {/* 1. TOP MAIN HEADER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-18 sm:h-20">
            {/* BRAND LOGO */}
            <Link
              href={`/store/${slug}`}
              className="flex items-center gap-3 shrink-0 group focus:outline-none max-w-[240px] sm:max-w-xs"
            >
              {logo ? (
                <img
                  src={logo}
                  alt={storeName}
                  className="w-10 h-10 object-contain rounded-xl border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-all duration-200 shrink-0 font-black text-base bg-blue-600"
                  style={primaryColor && primaryColor !== '#2563eb' ? { backgroundColor: primaryColor } : {}}
                >
                  {storeName ? storeName.charAt(0).toUpperCase() : <ShoppingBag className="w-5 h-5 text-white" strokeWidth={2.2} />}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <div className="truncate text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                  {storeName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wide truncate">
                    {category || (slug !== 'main' ? `${slug}.bitcommerce.app` : 'Official Storefront')}
                  </span>
                </div>
              </div>
            </Link>

            {/* SEARCH BAR (SOLID BLUE & WHITE CAPSULE) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-6">
              <div className="flex items-center w-full bg-white hover:border-slate-300 border border-slate-200 rounded-xl shadow-2xs focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200 overflow-hidden h-10 px-1.5">
                <div className="pl-2.5 pr-2 flex items-center justify-center text-slate-400">
                  <Search className="w-4 h-4" strokeWidth={2} />
                </div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={`Search in ${storeName}...`}
                  aria-label="Search products"
                  className="flex-1 h-full px-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                />

                <button
                  type="button"
                  aria-label="Submit search"
                  className="h-7 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs"
                  style={primaryColor && primaryColor !== '#2563eb' ? { backgroundColor: primaryColor } : {}}
                >
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* RIGHT ACTIONS: CUSTOMER ACCOUNT & CART */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Customer Account Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-bold transition-all focus:outline-none cursor-pointer active:scale-95 shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                      {customer ? 'Customer' : 'Account'}
                    </span>
                    <span className="text-xs font-black text-slate-900 truncate max-w-[85px]">
                      {customer ? customer.name : 'Sign In'}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100">
                    {customer ? (
                      <>
                        <div className="px-4 py-2.5 bg-blue-50/40">
                          <p className="text-xs font-black text-slate-900 truncate">{customer.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {customer.phone || customer.email || 'Customer Account'}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href={`/store/${slug}/account`}
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <UserCircle className="w-4 h-4 text-blue-500" />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            href={`/store/${slug}/account/orders`}
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Package className="w-4 h-4 text-blue-500" />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            href={`/store/${slug}/track`}
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Search className="w-4 h-4 text-blue-500" />
                            <span>Track an Order</span>
                          </Link>
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleCustomerLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                          >
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Customer Portal
                          </span>
                        </div>
                        <div className="py-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerAuth('login')}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left cursor-pointer"
                          >
                            <LogIn className="w-4 h-4 text-blue-600" />
                            <span>Customer Sign In</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerAuth('register')}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4 text-emerald-600" />
                            <span>Create Account</span>
                          </button>
                        </div>
                        <div className="pt-1">
                          <Link
                            href={`/store/${slug}/track`}
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Package className="w-4 h-4 text-slate-400" />
                            <span>Track My Order</span>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* SOLID ROYAL BLUE CART BUTTON (NO GRADIENT) */}
              <button
                type="button"
                onClick={() => dispatch(toggleCartDrawer(true))}
                aria-label="View Cart"
                className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all duration-150 active:scale-95 cursor-pointer group"
                style={primaryColor && primaryColor !== '#2563eb' ? { backgroundColor: primaryColor } : {}}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShoppingBag className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                  </div>
                  {displayCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 bg-white text-blue-700 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs ring-2 ring-blue-600 animate-in zoom-in">
                      {displayCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col text-left leading-tight pr-0.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-100 hidden sm:inline">
                    Cart
                  </span>
                  <span className="text-xs font-black text-white">
                    {displaySubtotal}
                  </span>
                </div>
              </button>

              {/* Mobile Menu Trigger */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 2. SUB-NAVIGATION ROW */}
          <nav aria-label="Storefront navigation" className="hidden md:flex items-center gap-8 pt-1 border-t border-slate-100">
            <Link
              href={`/store/${slug}`}
              className={`text-xs pb-2.5 pt-1 transition-all ${
                activeTab === 'home'
                  ? 'font-bold text-blue-600 border-b-2 border-blue-600'
                  : 'font-medium text-slate-600 hover:text-blue-600'
              }`}
            >
              Home
            </Link>
            <Link
              href={`/store/${slug}/shop`}
              className={`text-xs pb-2.5 pt-1 transition-all ${
                activeTab === 'shop'
                  ? 'font-bold text-blue-600 border-b-2 border-blue-600'
                  : 'font-medium text-slate-600 hover:text-blue-600'
              }`}
            >
              Shop
            </Link>
          </nav>
        </div>

        {/* MOBILE SEARCH & MENU DRAWER */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-10 px-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-col space-y-1 text-xs font-bold text-slate-700">
              <Link
                href={`/store/${slug}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg ${activeTab === 'home' ? 'text-blue-600 bg-blue-50 font-bold' : 'hover:bg-slate-50 font-medium text-slate-600'}`}
              >
                Home
              </Link>
              <Link
                href={`/store/${slug}/shop`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg ${activeTab === 'shop' ? 'text-blue-600 bg-blue-50 font-bold' : 'hover:bg-slate-50 font-medium text-slate-600'}`}
              >
                Shop
              </Link>
              <Link
                href={`/store/${slug}/track`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-600"
              >
                Track Order
              </Link>
              {customer ? (
                <>
                  <Link
                    href={`/store/${slug}/account`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-600"
                  >
                    My Profile
                  </Link>
                  <Link
                    href={`/store/${slug}/account/orders`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-600"
                  >
                    My Orders
                  </Link>
                  <button
                    type="button"
                    onClick={handleCustomerLogout}
                    className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-left font-bold"
                  >
                    Sign Out ({customer.name})
                  </button>
                </>
              ) : (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCustomerAuth('login')}
                    className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-center font-bold"
                  >
                    Customer Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCustomerAuth('register')}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-center font-bold shadow-xs"
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
