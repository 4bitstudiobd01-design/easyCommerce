'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star, User } from 'lucide-react';

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const stories = [
    {
      quote:
        'EasyCommerce lets me manage orders, payments, and delivery from one dashboard. It saves time and makes my small shop feel professional.',
      author: 'Farzana Haque',
      title: 'Owner, Mrittika Crafts',
      initials: 'FH',
      avatarBg: 'bg-blue-100 text-blue-700',
    },
    {
      quote:
        'EasyCommerce gave me a full website to build my brand. Customers can browse, order, and pay easily via bKash. I feel like a real business owner now.',
      author: 'Shamim Reza',
      title: 'Proprietor, Deshi Look',
      initials: 'SR',
      avatarBg: 'bg-emerald-100 text-emerald-700',
    },
    {
      quote:
        'EasyCommerce helped me create a clean catalog for my bakery and take orders online. Booking Steadfast courier directly from the order panel is amazing.',
      author: 'Lubna Akhter',
      title: 'Founder, Cake Bari',
      initials: 'LA',
      avatarBg: 'bg-purple-100 text-purple-700',
    },
    {
      quote:
        'Starting an online D2C store was intimidating until I found EasyCommerce. Zero-code setup took 5 minutes and sales doubled in our first month.',
      author: 'Tanvir Hossain',
      title: 'Founder, Urban Attire BD',
      initials: 'TH',
      avatarBg: 'bg-indigo-100 text-indigo-700',
    },
  ];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  return (
    <section className="py-20 px-6 bg-white border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header & Navigation Buttons */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Merchant Stories
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              How we transformed their journey
            </h2>
            <p className="text-slate-500 text-base font-normal">
              Real stories from Bangladeshi entrepreneurs building their online empire.
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handlePrev}
              className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-700 transition-colors shadow-sm active:scale-95"
              aria-label="Previous Testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-3 bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-full text-white transition-colors shadow-md shadow-blue-600/20 active:scale-95"
              aria-label="Next Testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((offset) => {
            const index = (currentIndex + offset) % stories.length;
            const item = stories[index];
            return (
              <div
                key={index}
                className="solid-card p-8 rounded-2xl flex flex-col justify-between space-y-6 transition-all duration-300 hover:border-blue-300"
              >
                <div className="space-y-4">
                  {/* Quote Icon & Stars */}
                  <div className="flex items-center justify-between">
                    <Quote className="w-8 h-8 text-blue-200 fill-blue-100" />
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-slate-700 text-sm leading-relaxed font-medium">
                    "{item.quote}"
                  </p>
                </div>

                {/* Author Metadata */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                      {item.author}
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">{item.title}</span>
                  </div>

                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs border border-slate-200 ${item.avatarBg}`}>
                    {item.initials}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
