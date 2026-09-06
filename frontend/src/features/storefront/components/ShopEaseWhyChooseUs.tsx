'use client';

import React from 'react';
import { Gift, ShieldCheck, Headphones, Crown } from 'lucide-react';

interface ShopEaseWhyChooseUsProps {
  storeName?: string;
  primaryColor?: string;
}

export const ShopEaseWhyChooseUs: React.FC<ShopEaseWhyChooseUsProps> = ({
  primaryColor = '#E05353',
}) => {
  const bottomPerks = [
    {
      id: 'exclusive-offers',
      title: 'Exclusive Offers',
      subtitle: 'Save more every day',
      icon: Gift,
    },
    {
      id: 'secure-payments',
      title: 'Secure Payments',
      subtitle: '100% safe & secure',
      icon: ShieldCheck,
    },
    {
      id: 'support-24-7',
      title: '24/7 Support',
      subtitle: "We're here to help",
      icon: Headphones,
    },
    {
      id: 'loyalty-rewards',
      title: 'Loyalty Rewards',
      subtitle: 'Earn points & get rewards',
      icon: Crown,
    },
  ];

  const accentColor = primaryColor || '#E05353';

  return (
    <section className="py-8 sm:py-12 bg-slate-50/60 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl sm:rounded-[32px] border border-slate-100/90 shadow-[0_10px_30px_rgba(0,0,0,0.04)] p-5 sm:p-6 lg:p-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-0 lg:divide-x lg:divide-slate-100">
            {bottomPerks.map((perk, index) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.id}
                  className={`flex items-center gap-3.5 sm:gap-4 group ${
                    index === 0
                      ? 'lg:pr-6'
                      : index === bottomPerks.length - 1
                      ? 'lg:pl-6'
                      : 'lg:px-6'
                  }`}
                >
                  {/* Soft circular badge */}
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor: '#FFF0F0',
                      color: accentColor,
                    }}
                  >
                    <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2.2} />
                  </div>

                  {/* Text Details */}
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
    </section>
  );
};
