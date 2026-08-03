'use client';

import React from 'react';
import { Product } from '@/features/catalog/api/catalogApi';
import { ShoppingBag, Sparkles, Zap, Shield, ChevronRight } from 'lucide-react';

interface ThemeProps {
  storeName: string;
  slug: string;
  category?: string;
  products: Product[];
  categories: any[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const MinimalDarkTheme: React.FC<ThemeProps> = ({
  storeName,
  slug,
  products,
  categories,
  onSelectProduct,
  onAddToCart,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Glow Ambient Top Bar */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white text-[11px] font-black text-center py-2 uppercase tracking-widest flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 fill-white" />
        <span>CYBER GLASSMORTAL EDITION • FREE NATIONWIDE SHIPPING</span>
      </div>

      {/* Navbar */}
      <nav className="border-b border-purple-900/40 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-purple-600/40 border border-purple-400/40">
            ⚡
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">{storeName}</h1>
            <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest block">
              MINIMAL CYBER DARK
            </span>
          </div>
        </div>

        <span className="px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full text-xs font-extrabold border border-purple-500/30">
          Dark Glass Edition
        </span>
      </nav>

      {/* Hero Header */}
      <div className="p-8 sm:p-12 relative overflow-hidden bg-slate-900/60 border-b border-purple-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <span className="px-3.5 py-1 bg-purple-600/20 text-purple-300 rounded-full text-xs font-black border border-purple-500/30 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Limited Cyber Drop
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Future-Ready Lifestyle &amp; Essentials
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Curated minimal aesthetics with ultra-premium design finish.
            </p>
          </div>
          <div className="w-full md:w-80 h-52 bg-slate-900 rounded-3xl border border-purple-500/30 overflow-hidden shadow-2xl relative">
            <img
              src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80"
              alt="Minimal Dark"
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> Featured Drop ({products.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => {
            const mainImg =
              prod.images && prod.images.length > 0
                ? typeof prod.images[0] === 'string'
                  ? prod.images[0]
                  : (prod.images[0] as any).url
                : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';

            return (
              <div
                key={prod.id}
                className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 hover:border-purple-500/60 transition duration-300 flex flex-col justify-between space-y-4 group backdrop-blur-md"
              >
                <div className="space-y-3">
                  <div className="relative h-48 bg-slate-950 rounded-2xl overflow-hidden cursor-pointer" onClick={() => onSelectProduct(prod)}>
                    <img
                      src={mainImg}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-purple-950/90 text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-500/40">
                      PREMIUM
                    </div>
                  </div>

                  <div>
                    <h4
                      onClick={() => onSelectProduct(prod)}
                      className="font-black text-sm text-white group-hover:text-purple-400 transition cursor-pointer line-clamp-1"
                    >
                      {prod.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {prod.description || 'Cyber minimal aesthetic item.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-purple-400">
                      ৳{Number(prod.basePrice).toLocaleString()} BDT
                    </span>
                    <span className="text-[10px] text-pink-400 font-extrabold bg-pink-500/10 border border-pink-500/30 px-2 py-0.5 rounded-full">
                      CYBER
                    </span>
                  </div>

                  <button
                    onClick={() => onAddToCart(prod)}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add To Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
