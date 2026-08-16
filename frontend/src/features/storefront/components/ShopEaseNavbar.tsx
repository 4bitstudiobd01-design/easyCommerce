'use client';

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
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { toggleCartDrawer } from '../slices/cartSlice';

interface ShopEaseNavbarProps {
  storeName?: string;
  slug?: string;
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

  const displayCount = totalItemCount > 0 ? totalItemCount : 3;
  const displaySubtotal = subtotal > 0 ? `৳${subtotal.toLocaleString('en-US')}` : '৳3,249';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      {/* 1. TOP MAIN HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-20">
          {/* BRAND LOGO */}
          <Link
            href={`/store/${slug}`}
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center tracking-tight leading-none text-xl sm:text-2xl font-black">
                <span className="text-slate-900">Shop</span>
                <span className="text-blue-600">Ease</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 tracking-wide mt-1">
                Everything you need
              </span>
            </div>
          </Link>

          {/* SEARCH BAR (CENTER - CLEAN WITHOUT ALL CATEGORIES DROPDOWN) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-6">
            <div className="flex items-center w-full bg-white border border-slate-200 rounded-xl shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600 transition-all overflow-hidden h-11">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search for products..."
                aria-label="Search products"
                className="flex-1 h-full px-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />

              <button
                type="button"
                aria-label="Submit search"
                className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <Search className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* RIGHT ACTIONS: ACCOUNT, WISHLIST & CART */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Account Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-50 text-xs font-bold transition-colors focus:outline-none"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Account</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    href="/login"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="block px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Merchant Login
                  </Link>
                  <Link
                    href={`/store/${slug}/track`}
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="block px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Track My Order
                  </Link>
                </div>
              )}
            </div>

            {/* Wishlist Button with (0) */}
            <button
              type="button"
              className="hidden lg:flex items-center gap-1 px-2.5 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              <Heart className="w-4 h-4 text-slate-600" />
              <span>Wishlist</span>
              <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center -ml-0.5">
                0
              </span>
            </button>

            {/* Cart Button with Count Badge & Subtotal */}
            <button
              type="button"
              onClick={() => dispatch(toggleCartDrawer(true))}
              aria-label="View Cart"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-50 text-xs font-bold transition-all relative focus:outline-none"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-slate-700" />
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                  {displayCount}
                </span>
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="hidden sm:inline">Cart</span>
                <span className="text-[11px] font-extrabold text-slate-900 hidden sm:inline">
                  {displaySubtotal}
                </span>
              </div>
            </button>

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 2. SUB-NAVIGATION ROW (ONLY HOME & SHOP) */}
        <nav aria-label="Storefront navigation" className="hidden md:flex items-center gap-8 pt-1 border-t border-slate-100">
          <Link
            href={`/store/${slug}`}
            className={`text-xs pb-2.5 pt-1 transition-colors ${
              activeTab === 'home'
                ? 'font-extrabold text-blue-600 border-b-2 border-blue-600'
                : 'font-semibold text-slate-600 hover:text-slate-900'
            }`}
          >
            Home
          </Link>
          <Link
            href={`/store/${slug}/shop`}
            className={`text-xs pb-2.5 pt-1 transition-colors ${
              activeTab === 'shop'
                ? 'font-extrabold text-blue-600 border-b-2 border-blue-600'
                : 'font-semibold text-slate-600 hover:text-slate-900'
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
              className={`px-3 py-2 rounded-lg ${activeTab === 'home' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              Home
            </Link>
            <Link
              href={`/store/${slug}/shop`}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-3 py-2 rounded-lg ${activeTab === 'shop' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              Shop
            </Link>
            <Link
              href={`/store/${slug}/track`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Track Order
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
