'use client';

import React from 'react';
import { Info, Globe } from 'lucide-react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { ProductStatus } from '@/features/catalog/api/catalogApi';

interface GeneralTabProps {
  form: ProductFormState;
}

export function GeneralTab({ form }: GeneralTabProps) {
  const {
    name,
    setName,
    description,
    setDescription,
    status,
    setStatus,
    isVisible,
    setIsVisible,
    customSlug,
    setCustomSlug,
    slugPreview,
    store,
    localImages,
    setLocalImages,
  } = form;

  return (
    <>
      {/* 1. Basic Information */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Basic Information</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Essential product identity and details</p>
        </div>

        {/* Product Name */}
        <div>
          <label htmlFor="product-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Product Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="product-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Premium Cotton Shirt"
            maxLength={255}
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">A clear, descriptive name used across storefront catalog and invoices.</p>
        </div>

        {/* Product Description */}
        <div>
          <label htmlFor="product-description" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Description
          </label>
          <textarea
            id="product-description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write detailed information about the product features, usage, specs, or highlights..."
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-y"
          />
          <p className="text-[11px] text-slate-400 mt-1.5">Provide detailed specifications or features for customer guidance.</p>
        </div>
      </div>

      {/* 2. Publishing Status & URL Slug */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Publishing Status & Visibility</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Control storefront visibility and customize your product URL</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Status Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ACTIVE">Active (Published)</option>
              <option value="DRAFT">Draft (Hidden)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {status === 'DRAFT'
                ? 'Draft products are saved to your merchant catalog but hidden from public customers.'
                : 'Active products are publicly visible on your store catalog.'}
            </p>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer mt-3">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Show this product on the storefront</span>
            </label>
            <p className="text-[11px] text-slate-400 mt-1">
              {isVisible
                ? 'Visible to customers when Active.'
                : "Hidden from storefront even if Active — useful for pausing a product without changing its status."}
            </p>
          </div>

          {/* URL Slug */}
          <div>
            <label htmlFor="custom-slug" className="block text-xs font-semibold text-slate-700 mb-1.5">
              URL Slug
            </label>
            <input
              id="custom-slug"
              type="text"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
              placeholder={slugPreview || 'custom-product-url'}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <div className="mt-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-[10.5px] font-mono text-slate-500 truncate">
              <span className="text-slate-400">Preview: </span>
              /store/{store?.slug || 'my-store'}/{customSlug || slugPreview || 'product-url'}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
