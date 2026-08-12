'use client';

import React from 'react';
import { Shirt, Smartphone, Dumbbell, Palette, Leaf, Footprints, Cake, Gem } from 'lucide-react';

export function BrandTicker() {
  const categories = [
    { name: 'Fashion & Apparel', icon: Shirt, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { name: 'Electronics & Gadgets', icon: Smartphone, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { name: 'Fitness & Sportswear', icon: Dumbbell, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { name: 'Handmade & Décor', icon: Palette, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { name: 'Organic & Textiles', icon: Leaf, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { name: 'Footwear & Accessories', icon: Footprints, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { name: 'Bakery & Food', icon: Cake, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { name: 'Jewelry & Gifts', icon: Gem, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  ];

  // Duplicate list to create a seamless infinite marquee scroll
  const marqueeList = [...categories, ...categories, ...categories];

  return (
    <section className="py-14 bg-slate-100/70 border-y border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-8">
        <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
          Built For Every Kind of Store — <span className="text-blue-600">Yours Could Be Next</span>
        </h3>
        <p className="text-slate-500 text-xs mt-1 font-medium">
          One platform for physical goods, digital products, and resell businesses across any category
        </p>
      </div>

      {/* Marquee Container */}
      <div className="relative w-full flex overflow-x-hidden select-none group">
        {/* Left & Right Gradient Fades */}
        <div className="absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-slate-100/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-slate-100/90 to-transparent z-10 pointer-events-none" />

        {/* Scrolling Content Track */}
        <div className="flex shrink-0 animate-marquee items-center gap-6 py-2">
          {marqueeList.map((category, idx) => {
            const Icon = category.icon;
            return (
              <div
                key={idx}
                className="solid-card px-6 py-3 rounded-xl flex items-center gap-3 bg-white hover:border-blue-400 transition-colors shadow-sm shrink-0 min-w-[180px]"
              >
                <div className={`p-2 rounded-lg border ${category.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 leading-none">{category.name}</h4>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
