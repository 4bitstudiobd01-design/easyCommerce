'use client';

import React, { useState } from 'react';
import type { Product } from '@/features/catalog/api/catalogApi';
import { ProductReviewsSection } from '../ProductReviewsSection';

interface ProductInfoTabsProps {
  product: Product;
  reviewCount: number;
  primaryColor: string;
}

type TabKey = 'description' | 'additional' | 'reviews' | 'questions';

/**
 * Reference-styled tabbed panel below the product hero: Description /
 * Additional Info / Reviews / Questions.
 */
export function ProductInfoTabs({ product, reviewCount, primaryColor }: ProductInfoTabsProps) {
  const [active, setActive] = useState<TabKey>('description');

  const specs = product.attributeValues || [];

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'description', label: 'Description' },
    { key: 'additional', label: 'Additional Info' },
    { key: 'reviews', label: `Reviews (${reviewCount})` },
    { key: 'questions', label: 'Questions' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-10">
      {/* Tab list */}
      <div className="flex md:flex-col gap-1 overflow-x-auto border-b md:border-b-0 md:border-r border-slate-200 pb-1 md:pb-0 md:pr-4">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className="text-left text-sm font-bold whitespace-nowrap px-3 py-2 rounded-lg transition-colors"
              style={
                isActive
                  ? { color: primaryColor, backgroundColor: `${primaryColor}0d` }
                  : { color: '#64748b' }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="min-w-0">
        {active === 'description' && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description || 'No description provided for this product.'}
            </p>
            {specs.length > 0 && (
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-2">Information</h4>
                <ul className="space-y-1.5">
                  {specs.map((av: any, i: number) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-slate-300">•</span>
                      <span>
                        <span className="font-semibold text-slate-700">
                          {av.attribute?.name || av.attributeName}:
                        </span>{' '}
                        {av.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {active === 'additional' && (
          <div>
            {specs.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
                <table className="w-full">
                  <tbody className="divide-y divide-slate-100">
                    {specs.map((av: any, i: number) => (
                      <tr key={i} className="even:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-700 w-1/3 bg-slate-50/80">
                          {av.attribute?.name || av.attributeName}
                        </td>
                        <td className="p-3 text-slate-900 font-medium">{av.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No additional information available.</p>
            )}
          </div>
        )}

        {active === 'reviews' && (
          <ProductReviewsSection productId={product.id} primaryColor={primaryColor} />
        )}

        {active === 'questions' && (
          <div className="text-sm text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">Have a question about this product?</p>
            <p>
              Reach out to the store directly — the seller usually replies within a day. Use the
              &ldquo;Ask question&rdquo; link above to start a conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
