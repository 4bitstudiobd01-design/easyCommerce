'use client';

import React from 'react';
import { Product } from '@/features/catalog/api/catalogApi';
import { ShoppingBag, Leaf, CheckCircle2, Truck, Sparkles, Plus } from 'lucide-react';

interface ThemeProps {
  storeName: string;
  slug: string;
  category?: string;
  products: Product[];
  categories: any[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const OrganicGroceryTheme: React.FC<ThemeProps> = ({
  storeName,
  slug,
  products,
  categories,
  onSelectProduct,
  onAddToCart,
}) => {
  return (
    <div className="min-h-screen bg-emerald-50/30 text-slate-800 font-sans">
      {/* Top Banner */}
      <div className="bg-emerald-700 text-white text-xs font-bold text-center py-2 flex items-center justify-center gap-2">
        <Leaf className="w-4 h-4" />
        <span>100% ORGANIC &amp; FRESH SUPERMARKET • SAME DAY HOME DELIVERY</span>
      </div>

      {/* Navbar */}
      <nav className="bg-white border-b border-emerald-100 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-600/20">
            🌿
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-emerald-950 tracking-tight">{storeName}</h1>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
              FRESH ORGANIC MARKET
            </span>
          </div>
        </div>

        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
          Green Edition
        </span>
      </nav>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white p-8 sm:p-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold inline-flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5" /> Farm Fresh Daily
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Fresh Organic Groceries Delivered To Your Doorstep
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm">
              Shop healthy fruits, vegetables, dairy, honey, and organic staples directly from trusted farms.
            </p>
          </div>
          <div className="w-full md:w-72 h-44 bg-white/10 rounded-3xl overflow-hidden border border-white/20 shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
              alt="Grocery"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between border-b border-emerald-200/80 pb-4">
          <h3 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" /> Organic Produce ({products.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => {
            const mainImg =
              prod.images && prod.images.length > 0
                ? typeof prod.images[0] === 'string'
                  ? prod.images[0]
                  : (prod.images[0] as any).url
                : 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800';

            return (
              <div
                key={prod.id}
                className="bg-white border border-emerald-100 rounded-3xl p-5 hover:shadow-xl hover:border-emerald-300 transition duration-300 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="relative h-44 bg-emerald-50 rounded-2xl overflow-hidden cursor-pointer" onClick={() => onSelectProduct(prod)}>
                    <img
                      src={mainImg}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <Leaf className="w-3 h-3" /> Organic
                    </div>
                  </div>

                  <div>
                    <h4
                      onClick={() => onSelectProduct(prod)}
                      className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition cursor-pointer line-clamp-1"
                    >
                      {prod.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {prod.description || '100% Organic certified produce.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-emerald-50">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-emerald-800">
                      ৳{Number(prod.basePrice).toLocaleString()} BDT
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      Fresh Stock
                    </span>
                  </div>

                  <button
                    onClick={() => onAddToCart(prod)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <Plus className="w-4 h-4" /> Add To Basket
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
