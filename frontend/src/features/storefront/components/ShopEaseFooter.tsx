'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Send,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from 'lucide-react';
import { toast } from 'sonner';

interface ShopEaseFooterProps {
  storeName?: string;
  slug?: string;
  primaryColor?: string;
  logo?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  footerDescription?: string;
}

const DEFAULT_FOOTER_DESCRIPTION =
  'Your verified online store for authentic goods, fast nationwide dispatch, and dependable customer support.';

export const ShopEaseFooter = ({
  storeName = 'ShopEase',
  slug = 'main',
  primaryColor = '#2563eb',
  logo,
  facebookUrl,
  instagramUrl,
  twitterUrl,
  youtubeUrl,
  footerDescription,
}: ShopEaseFooterProps) => {
  const [email, setEmail] = useState('');

  const socialLinks = [
    { href: facebookUrl, label: 'Facebook', Icon: Facebook, hoverClasses: 'hover:bg-blue-600 hover:border-blue-600' },
    { href: instagramUrl, label: 'Instagram', Icon: Instagram, hoverClasses: 'hover:bg-pink-600 hover:border-pink-600' },
    { href: twitterUrl, label: 'Twitter', Icon: Twitter, hoverClasses: 'hover:bg-sky-500 hover:border-sky-500' },
    { href: youtubeUrl, label: 'YouTube', Icon: Youtube, hoverClasses: 'hover:bg-red-600 hover:border-red-600' },
  ].filter((social) => !!social.href);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setEmail('');
    toast.success('Thank you for subscribing to our newsletter!');
  };

  return (
    <footer id="contact" className="bg-slate-950 text-slate-400 text-xs pt-16 pb-10 border-t border-slate-800/80 relative overflow-hidden">
      {/* Subtle top glow line */}
      <div
        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent to-transparent"
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${primaryColor}80, transparent)` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TOP 5 COLUMNS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 pb-12 border-b border-slate-900">
          {/* COL 1: BRAND INFO (4 COLS ON LG) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href={`/store/${slug}`} className="flex items-center gap-3 inline-flex group">
              {logo ? (
                <img
                  src={logo}
                  alt={storeName}
                  className="w-10 h-10 rounded-2xl object-contain bg-white shadow-md transition-transform group-hover:scale-105 shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md font-black text-base transition-transform group-hover:scale-105 shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {storeName ? storeName.charAt(0).toUpperCase() : <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2.2} />}
                </div>
              )}
              <div
                className="text-xl font-black tracking-tight text-white transition-colors group-hover:[color:var(--brand-hover)]"
                style={{ ['--brand-hover' as any]: primaryColor }}
              >
                {storeName}
              </div>
            </Link>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {footerDescription?.trim() ? footerDescription : DEFAULT_FOOTER_DESCRIPTION}
            </p>

            {/* Social Icons */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {socialLinks.map(({ href, label, Icon, hoverClasses }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer ${hoverClasses}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* COL 2: QUICK LINKS (2 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-black text-xs uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link href={`/store/${slug}`} className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href={`/store/${slug}/shop`} className="hover:text-white transition-colors">
                  Shop Catalog
                </Link>
              </li>
              <li>
                <Link href={`/store/${slug}/track`} className="hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* COL 4: POLICIES (2 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-black text-xs uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link href={`/store/${slug}/privacy`} className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={`/store/${slug}/terms`} className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href={`/store/${slug}/refund-policy`} className="hover:text-white transition-colors">
                  Refund & Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* COL 5: NEWSLETTER (2 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-black text-xs uppercase tracking-wider">Stay Connected</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Receive updates on flash deals and special discounts.
            </p>
            <form onSubmit={handleSubscribe} className="flex items-center gap-1.5 mt-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full h-10 px-3 bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 text-xs rounded-xl focus:outline-none transition-colors focus:[border-color:var(--newsletter-focus)]"
                style={{ ['--newsletter-focus' as any]: primaryColor }}
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="h-10 w-10 hover:brightness-110 active:scale-95 text-white flex items-center justify-center rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT & PAYMENT BADGES */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} {storeName}. Powered by BitCommerce.</p>

          {/* Payment Badges in frosted pill container */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80">
            <span className="font-black text-slate-300 text-xs tracking-wider">VISA</span>
            <span className="text-slate-600">•</span>
            <span className="font-bold text-slate-300 text-xs tracking-tight">Mastercard</span>
            <span className="text-slate-600">•</span>
            <span className="font-black text-pink-400 text-xs">bKash</span>
            <span className="text-slate-600">•</span>
            <span className="font-black text-orange-400 text-xs">Nagad</span>
            <span className="text-slate-600">•</span>
            <span className="font-extrabold text-emerald-400 text-xs">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
