'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Rocket, HeartHandshake, MessagesSquare } from 'lucide-react';

export function Testimonials() {
  const commitments = [
    {
      icon: Rocket,
      title: 'Launch in Minutes, Not Weeks',
      desc: 'Register, pick a theme, add products — your store is live the same day, with no developer required.',
    },
    {
      icon: HeartHandshake,
      title: 'Built With Early Merchants',
      desc: "We're onboarding our first merchants directly — your feedback shapes what we build next.",
    },
    {
      icon: MessagesSquare,
      title: 'Direct Line to the Team',
      desc: 'No ticket queues. Reach us directly through your dashboard or the contact page and get a real answer.',
    },
  ];

  return (
    <section className="py-20 px-6 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Early Access
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Be one of our first merchants
          </h2>
          <p className="text-slate-500 text-base font-normal">
            EasyCommerce is early — that means direct support, fast fixes, and a product shaped by the merchants building on it now.
          </p>
        </div>

        {/* Commitment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {commitments.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="solid-card p-8 rounded-2xl flex flex-col space-y-4 transition-all duration-300 hover:border-blue-300"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit border border-blue-100">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 inline-flex items-center gap-2 transition-all active:scale-95"
          >
            <span>Start Your Store Today</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
