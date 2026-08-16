'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export function CtaBannerSection() {
  return (
    <section className="pt-12 pb-0 px-4 sm:px-6 bg-white relative z-10 -mb-16">
      <div className="max-w-7xl mx-auto bg-blue-600 rounded-3xl p-8 sm:p-12 lg:p-14 text-white shadow-2xl shadow-blue-600/30">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left Column: Heading & Subtitle */}
          <div className="space-y-3 max-w-xl text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold tracking-tight leading-tight">
              Ready to take your business online?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 font-normal leading-relaxed">
              Join thousands of merchants who trust EasyCommerce to grow their online business.
            </p>
          </div>

          {/* Right Column: CTAs & Trust Badges */}
          <div className="space-y-3.5 shrink-0 flex flex-col items-center lg:items-end">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Start Your Store — Free */}
              <Link
                href="/register"
                className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-black/10 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <span>Start Your Store — Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Schedule a Demo */}
              <Link
                href="/contact"
                className="px-5 py-3 bg-transparent hover:bg-white/10 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/40 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full border border-white/80 flex items-center justify-center">
                  <Play className="w-2 h-2 fill-white ml-0.5" />
                </div>
                <span>Schedule a Demo</span>
              </Link>
            </div>

            {/* Sub-badges */}
            <div className="flex items-center gap-4 text-[11px] font-medium text-blue-100/90 pt-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border border-blue-300 flex items-center justify-center text-[9px] leading-none">
                  ✓
                </span>
                <span>No credit card required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border border-blue-300 flex items-center justify-center text-[9px] leading-none">
                  ✓
                </span>
                <span>Setup in 2 minutes</span>
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
