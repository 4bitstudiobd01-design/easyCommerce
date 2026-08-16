'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  Home,
  Sparkles,
  Layers,
  CreditCard,
  Rocket,
  Store,
  ChevronUp,
} from 'lucide-react';

export function MobileAppBottomNav() {
  const [activeSection, setActiveSection] = useState<'home' | 'features' | 'solutions' | 'pricing'>('home');
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const featuresEl = document.getElementById('features');
      const solutionsEl = document.getElementById('solutions');
      const pricingEl = document.getElementById('pricing');

      if (pricingEl && scrollY >= pricingEl.offsetTop - 300) {
        setActiveSection('pricing');
      } else if (featuresEl && scrollY >= featuresEl.offsetTop - 300) {
        setActiveSection('features');
      } else if (solutionsEl && scrollY >= solutionsEl.offsetTop - 300) {
        setActiveSection('solutions');
      } else {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="md:hidden fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* Ultra-Sleek Floating Glass App Dock */}
      <nav className="pointer-events-auto w-full max-w-[360px] bg-slate-950/85 backdrop-blur-2xl border border-white/10 text-white rounded-full px-3 py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex items-center justify-between transition-all duration-300">
        
        {/* 1. Home Tab */}
        <Link
          href="/"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setActiveSection('home');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-85 ${
            activeSection === 'home'
              ? 'text-white bg-white/15 font-bold shadow-inner'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[9px] mt-0.5 tracking-tight font-medium">Home</span>
        </Link>

        {/* 2. Features Tab */}
        <Link
          href="/#features"
          onClick={() => setActiveSection('features')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-85 ${
            activeSection === 'features'
              ? 'text-white bg-white/15 font-bold shadow-inner'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[9px] mt-0.5 tracking-tight font-medium">Features</span>
        </Link>

        {/* 3. Solutions Tab */}
        <Link
          href="/#solutions"
          onClick={() => setActiveSection('solutions')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-85 ${
            activeSection === 'solutions'
              ? 'text-white bg-white/15 font-bold shadow-inner'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[9px] mt-0.5 tracking-tight font-medium">Solutions</span>
        </Link>

        {/* 4. Pricing Tab */}
        <Link
          href="/#pricing"
          onClick={() => setActiveSection('pricing')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-85 ${
            activeSection === 'pricing'
              ? 'text-white bg-white/15 font-bold shadow-inner'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[9px] mt-0.5 tracking-tight font-medium">Pricing</span>
        </Link>

        {/* 5. Glowing App Action Pill */}
        {mounted && isAuthenticated ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold py-2 px-3.5 rounded-full shadow-lg shadow-blue-600/40 active:scale-90 transition-transform"
          >
            <Store className="w-3.5 h-3.5" />
            <span>App</span>
          </Link>
        ) : (
          <Link
            href="/register"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold py-2 px-3.5 rounded-full shadow-lg shadow-blue-600/40 active:scale-90 transition-transform"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Start</span>
          </Link>
        )}

      </nav>
    </div>
  );
}
