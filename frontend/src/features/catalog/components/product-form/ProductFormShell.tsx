'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Save,
  Globe,
  AlertCircle,
  Loader2,
  ChevronRight,
  CheckCircle2,
  Info,
  Image as ImageIcon,
  FolderTree,
  DollarSign,
  Boxes,
  Layers,
  Truck,
} from 'lucide-react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { PRODUCT_FORM_TABS } from './tabs';

interface ProductFormShellProps {
  form: ProductFormState;
  children: React.ReactNode;
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  general: <Info className="w-3.5 h-3.5" />,
  media: <ImageIcon className="w-3.5 h-3.5" />,
  organization: <FolderTree className="w-3.5 h-3.5" />,
  pricing: <DollarSign className="w-3.5 h-3.5" />,
  inventory: <Boxes className="w-3.5 h-3.5" />,
  variants: <Layers className="w-3.5 h-3.5" />,
  shipping: <Truck className="w-3.5 h-3.5" />,
};

/**
 * Single-Page Navigation Product Form Shell:
 * Displays all product form sections on a single unified page with smooth scroll navigation,
 * scroll-spy section tracking, live sticky summary, and persistent actions.
 */
export function ProductFormShell({ form, children }: ProductFormShellProps) {
  const {
    isEditMode,
    isDuplicateMode,
    editId,
    sourceId,
    isLoadingSource,
    errorMsg,
    isBusy,
    status,
    handleFormSubmit,
    productType,
    localImages,
    numericBasePrice,
    currencySymbol,
    trackInventory,
    initialStock,
    categories,
    categoryId,
    brands,
    brandId,
  } = form;

  const [activeSection, setActiveSection] = useState('general');

  // Scroll to section with offset for sticky header
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Scroll-spy observer to track active section while scrolling
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (let i = PRODUCT_FORM_TABS.length - 1; i >= 0; i--) {
        const tab = PRODUCT_FORM_TABS[i];
        const el = document.getElementById(`section-${tab.id}`);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(tab.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const pageTitle = isEditMode ? 'Edit Product' : isDuplicateMode ? 'Duplicate Product' : 'Create Product';

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-5 pb-20">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{pageTitle}</h1>
          <nav aria-label="Breadcrumb" className="mt-1">
            <ol className="flex items-center gap-1 text-xs text-slate-500">
              <li>
                <Link href="/dashboard" className="hover:text-slate-700 font-medium transition-colors">
                  Dashboard
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </li>
              <li>
                <Link href="/dashboard/products" className="hover:text-slate-700 font-medium transition-colors">
                  Products
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </li>
              <li className="font-semibold text-slate-700" aria-current="page">
                {pageTitle}
              </li>
            </ol>
          </nav>
          {isDuplicateMode && (
            <p className="text-xs text-slate-500 mt-1.5">
              Saved as a new draft product — give the copy its own SKU and slug before publishing.
            </p>
          )}
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isEditMode ? (
            <>
              <Link
                href={`/dashboard/products/${editId}`}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <span>Cancel</span>
              </Link>

              <button
                type="button"
                onClick={() => handleFormSubmit(status)}
                disabled={isBusy}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/dashboard/products"
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <span>Cancel</span>
              </Link>

              <button
                type="button"
                onClick={() => handleFormSubmit('DRAFT')}
                disabled={isBusy}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Save className="w-4 h-4 text-slate-500" />}
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormSubmit('ACTIVE')}
                disabled={isBusy}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Globe className="w-4 h-4" />}
                <span>Publish Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading the source product for edit/duplicate */}
      {sourceId && isLoadingSource && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-800 text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Loading product details…</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-medium shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Validation Error: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* 3-Column Responsive Single-Page Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sticky Navigation Menu */}
        <nav
          aria-label="Product form sections"
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-2.5 lg:sticky lg:top-6"
        >
          <div className="px-3 py-1.5 mb-1 hidden lg:block">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sections</span>
          </div>

          <ul className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-none">
            {PRODUCT_FORM_TABS.map((t) => {
              const isActive = activeSection === t.id;
              return (
                <li key={t.id} className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={() => scrollToSection(t.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25 ring-2 ring-blue-600/10'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>{TAB_ICONS[t.id]}</span>
                    <span>{t.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Middle Content Column - All Sections Rendered Vertically */}
        <div className="lg:col-span-7 space-y-8">{children}</div>

        {/* Right Sticky Sidebar Column: summary, tips, mobile actions */}
        <div className="lg:col-span-3 space-y-5 lg:sticky lg:top-6">
          {/* Live Product Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">Product Summary</h2>
            <div className="space-y-0.5">
              {[
                {
                  label: 'Product Type',
                  value:
                    productType === 'PHYSICAL'
                      ? 'Physical Product'
                      : productType === 'DIGITAL'
                      ? 'Digital Product'
                      : 'Service',
                },
                { label: 'Status', value: status.charAt(0) + status.slice(1).toLowerCase() },
                { label: 'Images', value: localImages.length },
                {
                  label: 'Price',
                  value: numericBasePrice > 0 ? `${currencySymbol}${numericBasePrice.toLocaleString()}` : '—',
                },
                {
                  label: 'Stock',
                  value: !trackInventory ? 'Not tracked' : initialStock !== '' ? initialStock : '—',
                },
                {
                  label: 'Category',
                  value: categories.find((c) => c.id === categoryId)?.name || '—',
                },
                { label: 'Brand', value: brands.find((b) => b.id === brandId)?.name || '—' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="text-xs text-slate-500">{row.label}</span>
                  <span className="text-xs font-bold text-slate-900 text-right truncate max-w-[55%]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">Quick Tips</h2>
            <ul className="space-y-2">
              {[
                'Add high quality images',
                'Write a clear description',
                'Set a competitive price',
                'Keep inventory accurate',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-600">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Submit Action Buttons in Sidebar */}
          <div className="space-y-2 pt-1">
            {isEditMode ? (
              <button
                type="button"
                onClick={() => handleFormSubmit(status)}
                disabled={isBusy}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleFormSubmit('ACTIVE')}
                  disabled={isBusy}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  <span>Publish Product</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFormSubmit('DRAFT')}
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Save className="w-4 h-4 text-slate-500" />}
                  <span>Save as Draft</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
