'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How fast can I launch my online store with BitCommerce?',
      a: 'In minutes. Register with your email, choose your store name, and your storefront is live immediately at your own store.bitcommerce.app address — no developer needed.',
    },
    {
      q: 'Do I need developer skills to set up bKash, Nagad, or Steadfast courier?',
      a: 'No developer skills are required. Checkout runs through SSLCommerz with bKash, Nagad, and card support built in, and Steadfast/Pathao courier booking is available directly from your order panel — just enter your gateway and courier credentials in your dashboard.',
    },
    {
      q: 'Can I connect my own custom domain (e.g. merchant.com)?',
      a: 'Custom domain binding is on our roadmap and not yet available. Every store gets a free store.bitcommerce.app subdomain today.',
    },
    {
      q: 'How does BitCommerce handle inventory management?',
      a: 'BitCommerce uses a decoupled inventory domain. Product definitions (titles, prices, SEO) are kept separate from physical stock levels, allowing you to track available stock across multiple warehouses effortlessly.',
    },
    {
      q: 'Is my store data isolated securely from other merchants?',
      a: 'Yes. BitCommerce uses row-level multi-tenancy in the database, so every query is scoped to your store — other merchants can never see or access your data.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 px-6 bg-white border-t border-slate-200 scroll-mt-16">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Got Questions?
          </span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 text-base">
            Everything you need to know about starting your eCommerce SaaS store in Bangladesh.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="solid-card rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-5 text-left flex items-center justify-between font-bold text-slate-900 text-base hover:text-blue-600 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-5 pb-5 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-1">
                  <p className="pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
