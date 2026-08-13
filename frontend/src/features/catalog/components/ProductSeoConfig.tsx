'use client';

import React, { useState, useEffect } from 'react';
import { Product, useUpdateProductSeoMutation } from '@/features/catalog/api/catalogApi';
import { Search, Globe, Eye, Save, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProductSeoConfigProps {
  product: Product;
  storeSlug?: string;
}

export function ProductSeoConfig({ product, storeSlug }: ProductSeoConfigProps) {
  const [updateProductSeo, { isLoading }] = useUpdateProductSeoMutation();

  const [seoTitle, setSeoTitle] = useState(product.seoTitle || '');
  const [metaDescription, setMetaDescription] = useState(product.metaDescription || '');
  const [slug, setSlug] = useState(product.slug || '');
  const [canonicalUrl, setCanonicalUrl] = useState(product.canonicalUrl || '');
  const [isSearchEngineIndexed, setIsSearchEngineIndexed] = useState<boolean>(
    product.isSearchEngineIndexed !== undefined ? product.isSearchEngineIndexed : true,
  );

  useEffect(() => {
    setSeoTitle(product.seoTitle || '');
    setMetaDescription(product.metaDescription || '');
    setSlug(product.slug || '');
    setCanonicalUrl(product.canonicalUrl || '');
    setIsSearchEngineIndexed(product.isSearchEngineIndexed !== undefined ? product.isSearchEngineIndexed : true);
  }, [product]);

  const displayTitle = seoTitle.trim() || product.name || product.title || 'Product Title';
  const displayDescription = metaDescription.trim() || product.description || 'Buy online with fast delivery from our store.';
  const displayUrl = `https://${storeSlug || 'mystore'}.easycommerce.io/products/${slug || 'product-slug'}`;

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProductSeo({
        id: product.id,
        seoTitle: seoTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        slug: slug.trim() || undefined,
        canonicalUrl: canonicalUrl.trim() || undefined,
        isSearchEngineIndexed,
      }).unwrap();

      toast.success('SEO configuration saved successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update SEO settings.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span>Search Engine Optimization (SEO)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimize how this product appears in Google search engine result pages
          </p>
        </div>

        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${isSearchEngineIndexed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {isSearchEngineIndexed ? 'Indexed by Google' : 'NoIndex (Hidden)'}
        </span>
      </div>

      <form onSubmit={handleSaveSeo} className="space-y-5">
        {/* SEO Title Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              SEO Title Tag
            </label>
            <span className={`text-[11px] font-mono font-bold ${seoTitle.length > 60 ? 'text-amber-600' : 'text-slate-400'}`}>
              {seoTitle.length} / 60 chars
            </span>
          </div>
          <input
            type="text"
            placeholder={product.name || 'e.g. Premium Cotton T-Shirt | EasyCommerce'}
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
          />
          {!seoTitle && (
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Defaults to Product Name when left blank.
            </p>
          )}
        </div>

        {/* Meta Description Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Meta Description
            </label>
            <span className={`text-[11px] font-mono font-bold ${metaDescription.length > 160 ? 'text-amber-600' : 'text-slate-400'}`}>
              {metaDescription.length} / 160 chars
            </span>
          </div>
          <textarea
            rows={3}
            placeholder={product.description || 'Provide a compelling search summary...'}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
          />
          {!metaDescription && (
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Defaults to Product Description when left blank.
            </p>
          )}
        </div>

        {/* URL Slug & Indexing Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              URL Handle / Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Search Engine Indexing
            </label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="indexing"
                  checked={isSearchEngineIndexed}
                  onChange={() => setIsSearchEngineIndexed(true)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Index (Visible to Google)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="indexing"
                  checked={!isSearchEngineIndexed}
                  onChange={() => setIsSearchEngineIndexed(false)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>NoIndex (Hide Page)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Google Search Result Live Preview Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Google Search Result Preview</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 shadow-xs">
            <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1.5 truncate">
              <Globe className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{displayUrl}</span>
            </div>
            <h4 className="text-sm font-extrabold text-blue-800 hover:underline cursor-pointer truncate">
              {displayTitle}
            </h4>
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {displayDescription}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save SEO Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
