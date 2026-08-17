'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { toggleCartDrawer } from '../slices/cartSlice';
import { ShoppingBag, Search, Store as StoreIcon, ShieldCheck, Phone, MapPin, Truck } from 'lucide-react';
import Link from 'next/link';

interface StorefrontNavbarProps {
  storeName: string;
  slug?: string;
  category?: string;
  phone?: string;
  address?: string;
  logo?: string;
  primaryColor?: string;
}

export function StorefrontNavbar({
  storeName,
  slug = 'main',
  category,
  phone,
  address,
  logo,
  primaryColor = '#2563eb',
}: StorefrontNavbarProps) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-300 text-[11px] font-semibold py-1.5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Official Digital Storefront: <span className="font-bold text-white">{storeName}</span></span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[10px]">
            {phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{phone}</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified BitCommerce Tenant</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link href={`/store/${slug}`} className="flex items-center gap-3 shrink-0">
          {logo ? (
            <img src={logo} alt={storeName} className="w-11 h-11 object-contain rounded-2xl border border-slate-200 shadow-sm" />
          ) : (
            <div
              className="w-11 h-11 rounded-2xl text-white font-extrabold text-lg flex items-center justify-center shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {storeName ? storeName[0].toUpperCase() : 'S'}
            </div>
          )}

          <div>
            <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight block leading-tight">
              {storeName}
            </span>
            <span className="text-[11px] font-bold block" style={{ color: primaryColor }}>
              {slug}.bitcommerce.app
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={`Search items in ${storeName}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all"
          />
        </div>

        {/* Action Items: Track Order & Cart Button */}
        <div className="flex items-center gap-3">
          <Link
            href={slug !== 'main' ? `/store/${slug}/track` : '/track'}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all"
          >
            <Truck className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span className="hidden sm:inline">Track Order</span>
          </Link>

          <button
            onClick={() => dispatch(toggleCartDrawer(true))}
            style={{ backgroundColor: primaryColor }}
            className="px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2.5 transition-all active:scale-95 relative"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">My Cart</span>
            {totalItemCount > 0 && (
              <span className="px-2 py-0.5 bg-white text-slate-900 text-[11px] font-extrabold rounded-full shadow-sm">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
