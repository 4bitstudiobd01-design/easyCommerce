'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, ShoppingBag, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-white pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* =======================================================================
            1. ROYAL BLUE CTA BANNER (EXACT MATCHING DESIGN)
        ======================================================================= */}
        <div className="bg-blue-600 rounded-t-2xl sm:rounded-t-3xl p-8 sm:p-12 lg:p-14 text-white shadow-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* Left Column: Heading & Subtitle */}
            <div className="space-y-3 max-w-xl text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight leading-tight">
                Ready to take your business online?
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
                Join thousands of merchants who trust BitCommerce to grow their online business.
              </p>
            </div>

            {/* Right Column: Actions & Trust Badges */}
            <div className="space-y-3 shrink-0 flex flex-col items-center lg:items-end">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Start Your Store — Free */}
                <Link
                  href="/register"
                  className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs sm:text-sm rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <span>Start Your Store — Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Schedule a Demo */}
                <Link
                  href="/contact"
                  className="px-5 py-3 bg-transparent hover:bg-white/10 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/60 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full border border-white/80 flex items-center justify-center">
                    <Play className="w-2 h-2 fill-white ml-0.5" />
                  </div>
                  <span>Schedule a Demo</span>
                </Link>
              </div>

              {/* Sub-badges */}
              <div className="flex items-center gap-4 text-[11px] font-medium text-blue-100 pt-1">
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

        {/* =======================================================================
            2. DARK NAVY FOOTER (EXACT MATCHING DESIGN)
        ======================================================================= */}
        <div className="bg-[#070b14] text-slate-400 p-8 sm:p-12 lg:p-14">
          <div className="space-y-12">
            
            {/* Top 5-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 sm:gap-10">
              
              {/* Brand Column (2 Spans) */}
              <div className="lg:col-span-2 space-y-4">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shadow-blue-500/30">
                    <ShoppingBag className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-extrabold text-base tracking-tight text-white">
                    BitCommerce
                  </span>
                </Link>
                <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-xs">
                  The all-in-one eCommerce platform built for modern businesses.
                </p>
                
                {/* Social Icons */}
                <div className="flex items-center gap-2.5 pt-1">
                  <Link
                    href="https://facebook.com"
                    target="_blank"
                    className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="https://twitter.com"
                    target="_blank"
                    className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="https://linkedin.com"
                    target="_blank"
                    className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="https://instagram.com"
                    target="_blank"
                    className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Column 1: Product */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-white tracking-wider">Product</p>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link href="/#integrations" className="hover:text-white transition-colors">Integrations</Link></li>
                  <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
                </ul>
              </div>

              {/* Column 2: Resources */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-white tracking-wider">Resources</p>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li><Link href="/about" className="hover:text-white transition-colors">Documentation</Link></li>
                  <li><Link href="/#faq" className="hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="/#how-it-works" className="hover:text-white transition-colors">Guides</Link></li>
                </ul>
              </div>

              {/* Column 3: Company */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-white tracking-wider">Company</p>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">Partners</Link></li>
                </ul>
              </div>

              {/* Column 4: Legal */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-white tracking-wider">Legal</p>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Refund Policy</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">Partners</Link></li>
                </ul>
              </div>

            </div>

            {/* Bottom Horizontal Bar */}
            <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
              <p>© 2026 BitCommerce. All rights reserved.</p>
              <p className="flex items-center gap-1">
                Made with <span className="text-red-500 text-xs">❤️</span> for merchants
              </p>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
}
