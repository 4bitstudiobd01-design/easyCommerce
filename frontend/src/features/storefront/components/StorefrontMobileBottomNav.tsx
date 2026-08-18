'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { toggleCartDrawer } from '../slices/cartSlice';
import {
  Home,
  ShoppingBag,
  Grid,
  Heart,
  User,
} from 'lucide-react';

interface StorefrontMobileBottomNavProps {
  slug?: string;
}

export function StorefrontMobileBottomNav({ slug = 'main' }: StorefrontMobileBottomNavProps) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isHome = pathname === `/store/${slug}` || pathname === `/store/${slug}/`;
  const isShop = pathname.includes(`/store/${slug}/shop`);

  return (
    <div className="md:hidden fixed bottom-3 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      {/* Floating Ultra-Sleek Glass App Dock */}
      <nav className="pointer-events-auto w-full max-w-[380px] bg-slate-950/90 backdrop-blur-2xl border border-white/10 text-white rounded-full px-2.5 py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-between transition-all duration-300">
        
        {/* 1. Home Tab */}
        <Link
          href={`/store/${slug}`}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 active:scale-85 ${
            isHome
              ? 'text-white bg-white/15 font-bold shadow-inner'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[9px] mt-0.5 font-medium tracking-tight">Home</span>
        </Link>

        {/* 2. Shop / Catalog Tab */}
        <Link
          href={`/store/${slug}/shop`}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 active:scale-85 ${
            isShop
              ? 'text-white bg-white/15 font-bold shadow-inner'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span className="text-[9px] mt-0.5 font-medium tracking-tight">Shop</span>
        </Link>

        {/* 3. Wishlist Tab */}
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('featured-products');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-full text-slate-400 hover:text-white transition-all duration-200 active:scale-85 relative"
        >
          <div className="relative">
            <Heart className="w-4 h-4" />
          </div>
          <span className="text-[9px] mt-0.5 font-medium tracking-tight">Saved</span>
        </button>

        {/* 4. Cart Floating Bag Trigger */}
        <button
          type="button"
          onClick={() => dispatch(toggleCartDrawer())}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold py-2 px-4 rounded-full shadow-lg shadow-blue-600/40 active:scale-90 transition-transform relative cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4" />
            {mounted && totalItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-white text-blue-700 text-[9px] font-black flex items-center justify-center shadow-xs">
                {totalItemCount}
              </span>
            )}
          </div>
          <span>Bag</span>
        </button>

      </nav>
    </div>
  );
}
