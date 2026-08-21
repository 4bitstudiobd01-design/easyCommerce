'use client';

import React from 'react';
import { ShoppingBag, Search, ShoppingCart, Menu } from 'lucide-react';

interface PlatformPreviewCardProps {
  platformName: string;
  tagline: string;
}

export function PlatformPreviewCard({
  platformName,
  tagline,
}: PlatformPreviewCardProps) {
  const displayPlatformName = platformName.trim() || 'EasyCommerce';
  const displayTagline = tagline.trim() || 'All-in-one eCommerce Platform';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 tracking-tight">
          Platform Preview
        </h3>
        <p className="text-[11px] text-slate-400 font-normal mt-0.5">
          This is how your platform branding appears to merchants.
        </p>
      </div>

      {/* Mini Mockup Window Box */}
      <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs bg-white">
        {/* Mock Storefront Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#008060] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-900 tracking-tight truncate max-w-[120px]">
              {displayPlatformName}
            </span>
          </div>

          {/* Right Header Navigation Icons */}
          <div className="flex items-center gap-3 text-slate-600">
            <Search className="w-3.5 h-3.5 text-slate-600 cursor-pointer" />
            <div className="relative">
              <ShoppingCart className="w-3.5 h-3.5 text-slate-600" />
              <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full bg-[#008060] text-white flex items-center justify-center text-[8px] font-bold">
                0
              </span>
            </div>
            <Menu className="w-4 h-4 text-slate-700 cursor-pointer" />
          </div>
        </div>

        {/* Hero Banner Box with Mint Tint */}
        <div className="bg-[#F4FAF8] py-8 px-4 text-center space-y-2.5">
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
            {displayTagline}
          </h4>
          <p className="text-[11px] text-slate-600 font-medium">
            Build. Manage. Grow.
          </p>
          <div className="pt-1.5">
            <button
              type="button"
              className="px-4 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-lg text-xs font-bold shadow-xs pointer-events-none transition-colors"
            >
              Shop Now
            </button>
          </div>
        </div>

        {/* Footer info with separator */}
        <div className="bg-white py-3 px-4 border-t border-slate-100 text-center">
          <span className="text-[11px] text-slate-500 font-medium">
            Powered by {displayPlatformName}
          </span>
        </div>
      </div>
    </div>
  );
}
