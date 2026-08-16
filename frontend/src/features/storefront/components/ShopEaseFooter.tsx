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
}

export const ShopEaseFooter = ({
  storeName = 'ShopEase',
  slug = 'main',
}: ShopEaseFooterProps) => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setIsSubscribing(true);
    setTimeout(() => {
      setIsSubscribing(false);
      setEmail('');
      toast.success('Thank you for subscribing to our newsletter!');
    }, 600);
  };

  return (
    <footer id="contact" className="bg-[#0F172A] text-slate-400 text-xs pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TOP 5 COLUMNS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 pb-12 border-b border-slate-800/80">
          {/* COL 1: BRAND INFO (4 COLS ON LG) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href={`/store/${slug}`} className="flex items-center gap-2.5 inline-flex">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2.2} />
              </div>
              <div className="text-xl font-black tracking-tight">
                <span className="text-white">Shop</span>
                <span className="text-blue-500">Ease</span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Your one-stop shop for quality products at the best prices.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="#facebook"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#instagram"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-pink-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#twitter"
                aria-label="Twitter"
                className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-sky-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#youtube"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* COL 2: QUICK LINKS (2 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-extrabold text-xs tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link href={`/store/${slug}`} className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#featured-products" className="hover:text-white transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="#categories" className="hover:text-white transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="#contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* COL 3: CUSTOMER SERVICE (2 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-extrabold text-xs tracking-wider">Customer Service</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link href="#about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#shipping" className="hover:text-white transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="#returns" className="hover:text-white transition-colors">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="#faqs" className="hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* COL 4: POLICIES (2 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-extrabold text-xs tracking-wider">Policies</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link href="#privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="#returns" className="hover:text-white transition-colors">
                  Return Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* COL 5: NEWSLETTER (2 COLS / 3 COLS) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-extrabold text-xs tracking-wider">Newsletter</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Subscribe to get updates on new arrivals and offers.
            </p>
            <form onSubmit={handleSubscribe} className="flex items-center mt-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full h-9 px-3 bg-white text-slate-900 placeholder:text-slate-400 text-xs rounded-l-lg focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubscribing}
                aria-label="Subscribe"
                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center rounded-r-lg transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT & PAYMENT BADGES */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2024 ShopEase. All rights reserved.</p>

          {/* Payment Badges */}
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-300 text-xs tracking-wider">VISA</span>
            <span className="font-bold text-slate-300 text-xs tracking-tight">mastercard</span>
            <span className="font-black text-pink-500 text-xs">bKash</span>
            <span className="font-black text-orange-500 text-xs">Nagad</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
