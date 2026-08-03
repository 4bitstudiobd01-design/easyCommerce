'use client';

import React from 'react';
import { Product } from '@/features/catalog/api/catalogApi';
import { ShoppingBag, Star, Sparkles, Heart, ArrowRight, ShieldCheck } from 'lucide-react';

interface ThemeProps {
  storeName: string;
  slug: string;
  category?: string;
  products: Product[];
  categories: any[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const LuxuryFashionTheme: React.FC<ThemeProps> = ({
  storeName,
  slug,
  products,
  categories,
  onSelectProduct,
  onAddToCart,
}) => {
  const primaryColor = '#d97706'; // Gold accent

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-serif">
      {/* Luxury Top Announcement */}
      <div className="bg-amber-600 text-slate-950 text-[11px] font-bold text-center py-2 uppercase tracking-widest font-sans">
        ✦ EXCLUSIVE BOUTIQUE COLLECTION • FREE EXPRESS NATIONWIDE DELIVERY ✦
      </div>

      {/* Luxury Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-amber-500 flex items-center justify-center font-bold text-amber-400 text-lg shadow-lg shadow-amber-500/20">
            {storeName.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-serif">{storeName}</h1>
            <span className="text-[10px] text-amber-500 uppercase tracking-widest block font-sans">
              HAUTE COUTURE &amp; FASHION
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-sans">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/30">
            Luxury Edition
          </span>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="relative h-[480px] bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-800">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80"
          alt="Luxury Fashion"
          className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105"
        />
        <div className="relative z-10 text-center space-y-4 max-w-2xl px-4">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-sans font-bold bg-slate-950/80 px-4 py-1 rounded-full border border-amber-500/30">
            NEW SEASON 2026 RELEASE
          </span>
          <h2 className="text-4xl sm:text-5xl font-normal text-white font-serif tracking-tight leading-tight">
            Elegance In Every Detail
          </h2>
          <p className="text-slate-300 text-sm font-sans max-w-md mx-auto">
            Discover handcrafted apparel, luxury accessories, and exclusive designer trends.
          </p>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-10">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-2xl font-serif text-white">Curated Collection</h3>
            <p className="text-xs text-amber-500/80 font-sans mt-0.5">Handpicked premium designs</p>
          </div>
          <span className="text-xs text-slate-400 font-sans">{products.length} Items</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((prod) => {
            const mainImg =
              prod.images && prod.images.length > 0
                ? typeof prod.images[0] === 'string'
                  ? prod.images[0]
                  : (prod.images[0] as any).url
                : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800';

            return (
              <div
                key={prod.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 group flex flex-col"
              >
                <div className="relative h-72 bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onSelectProduct(prod)}>
                  <img
                    src={mainImg}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
                  />
                  <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-amber-400 text-xs font-sans font-bold border border-amber-500/30">
                    ৳{Number(prod.basePrice).toLocaleString()} BDT
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4
                      onClick={() => onSelectProduct(prod)}
                      className="font-serif text-lg text-white group-hover:text-amber-400 transition cursor-pointer line-clamp-1"
                    >
                      {prod.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-sans line-clamp-2 mt-1">
                      {prod.description || 'Exclusive luxury designer apparel.'}
                    </p>
                  </div>

                  <button
                    onClick={() => onAddToCart(prod)}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-sans font-extrabold text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
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
