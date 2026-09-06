'use client';

import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';

interface ShopEaseFeaturesBarProps {
  primaryColor?: string;
  className?: string;
}

export const ShopEaseFeaturesBar: React.FC<ShopEaseFeaturesBarProps> = ({
  primaryColor = '#E05353',
  className = '',
}) => {
  const perks = [
    {
      id: 'premium-quality',
      title: 'Premium Quality',
      subtitle: 'Handpicked just for you',
      icon: ShieldCheck,
    },
    {
      id: 'fast-delivery',
      title: 'Fast Delivery',
      subtitle: 'On-time delivery guaranteed',
      icon: Truck,
    },
    {
      id: 'easy-returns',
      title: 'Easy Returns',
      subtitle: '7 days return policy',
      icon: RotateCcw,
    },
    {
      id: 'best-prices',
      title: 'Best Prices',
      subtitle: 'Stylish looks, best prices',
      icon: Award,
    },
  ];

  const accentColor = primaryColor || '#E05353';

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="bg-white rounded-3xl sm:rounded-[32px] border border-slate-100/90 shadow-[0_12px_36px_rgba(0,0,0,0.05)] p-5 sm:p-6 lg:p-7 transition-all duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-0 lg:divide-x lg:divide-slate-100">
          {perks.map((perk, index) => {
            const Icon = perk.icon;
            return (
              <div
                key={perk.id}
                className={`flex items-center gap-3.5 sm:gap-4 group ${
                  index === 0
                    ? 'lg:pr-6'
                    : index === perks.length - 1
                    ? 'lg:pl-6'
                    : 'lg:px-6'
                }`}
              >
                {/* Circular Icon Badge */}
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor: '#FFF0F0',
                    color: accentColor,
                  }}
                >
                  <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2.2} />
                </div>

                {/* Text Content */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-tight">
                    {perk.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-normal sm:font-medium mt-0.5 leading-snug">
                    {perk.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
