'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useGetStoreBySlugQuery } from '@/features/tenant/api/tenantApi';
import { ShopEaseNavbar } from './ShopEaseNavbar';
import { ShopEaseFooter } from './ShopEaseFooter';
import { CartDrawer } from './CartDrawer';
import { FileText } from 'lucide-react';

interface StorePolicyPageProps {
  title: string;
  content?: string;
  emptyMessage: string;
}

export function StorePolicyPage({ title, content, emptyMessage }: StorePolicyPageProps) {
  const params = useParams();
  const slug = params?.slug as string;

  const { data: store } = useGetStoreBySlugQuery(slug, { skip: !slug });
  const primaryColor = store?.primaryColor || '#2563eb';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <CartDrawer primaryColor={primaryColor} />
      <ShopEaseNavbar
        storeName={store?.name || 'Storefront'}
        slug={slug}
        category={store?.category}
        primaryColor={primaryColor}
        logo={store?.logo}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8">
        <Link
          href={`/store/${slug}`}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
        >
          <span>← Back to {store?.name || 'Store'}</span>
        </Link>

        <div className="mt-6 bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-6 sm:p-10">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mb-6">
            {title}
          </h1>

          {content?.trim() ? (
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</div>
          ) : (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-11 h-11 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 max-w-xs">{emptyMessage}</p>
            </div>
          )}
        </div>
      </main>

      <ShopEaseFooter storeName={store?.name} slug={slug} primaryColor={primaryColor} logo={store?.logo} />
    </div>
  );
}
