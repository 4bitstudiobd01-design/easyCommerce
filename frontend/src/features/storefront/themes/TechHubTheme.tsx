'use client';

import React from 'react';
import { Product } from '@/features/catalog/api/catalogApi';
import { ShoppingBag, Cpu, Zap, ShieldCheck, CheckCircle2, Search, ArrowRight } from 'lucide-react';

interface ThemeProps {
  storeName: string;
  slug: string;
  category?: string;
  products: Product[];
  categories: any[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const TechHubTheme: React.FC<ThemeProps> = ({
  storeName,
  slug,
  products,
  categories,
  onSelectProduct,
  onAddToCart,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Tech Announcement Header */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white text-[11px] font-extrabold text-center py-2 uppercase tracking-wider flex items-center justify-center gap-2">
        <Zap className="w-3.5 h-3.5 fill-white" />
        <span>TECH FLASH SALE • 100% GENUINE WARRANTY &amp; EXPRESS DELIVERY</span>
      </div>

      {/* Cyber Navbar */}
      <nav className="border-b border-sky-950/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-sky-500/30 border border-sky-400/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">{storeName}</h1>
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
              ELECTRONICS &amp; TECH STORE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/30 text-xs font-bold">
            Cyber Edition
          </span>
        </div>
      </nav>

      {/* Cyber Tech Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 p-8 sm:p-12 border-b border-sky-900/40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs font-bold border border-sky-400/30 inline-flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-sky-400" /> Next-Gen Gadgets 2026
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Upgrade Your Digital Lifestyle
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore authentic smartphones, laptops, smartwatches, and gaming accessories with official brand warranty.
            </p>
          </div>
          <div className="w-full md:w-80 h-48 bg-slate-900 rounded-3xl border border-sky-500/30 overflow-hidden shadow-2xl relative">
            <img
              src="https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80"
              alt="Tech"
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        </div>
      </div>

      {/* Tech Product Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" /> Tech Catalog ({products.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => {
            const mainImg =
              prod.images && prod.images.length > 0
                ? typeof prod.images[0] === 'string'
                  ? prod.images[0]
                  : (prod.images[0] as any).url
                : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';

            return (
              <div
                key={prod.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 hover:border-sky-500/50 transition duration-300 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="relative h-48 bg-slate-950 rounded-2xl overflow-hidden cursor-pointer" onClick={() => onSelectProduct(prod)}>
                    <img
                      src={mainImg}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      GENUINE
                    </div>
                  </div>

                  <div>
                    <h4
                      onClick={() => onSelectProduct(prod)}
                      className="font-bold text-sm text-white group-hover:text-sky-400 transition cursor-pointer line-clamp-1"
                    >
                      {prod.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {prod.description || 'High-performance tech gadget.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-sky-400">
                      ৳{Number(prod.basePrice).toLocaleString()} BDT
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      In Stock
                    </span>
                  </div>

                  <button
                    onClick={() => onAddToCart(prod)}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30"
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
