'use client';

import React, { useState, useEffect } from 'react';
import { Search, Package, PlusCircle, ImageOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useGetProductsQuery } from '../../catalog/api/catalogApi';

export interface AddedOrderItem {
  productId?: string;
  variantId?: string;
  isCustomItem?: boolean;
  customTitle?: string;
  customUnitPrice?: number;
  quantity: number;
  discountAmount?: number;
  // Display-only fields, not sent to the backend as-is (edit page hydrates from these).
  title: string;
  unitPrice: number;
  productImageUrl?: string | null;
  sku?: string;
}

interface AddOrderItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: AddedOrderItem) => void;
}

type Tab = 'catalog' | 'custom';

export function AddOrderItemModal({ isOpen, onClose, onAdd }: AddOrderItemModalProps) {
  const [tab, setTab] = useState<Tab>('catalog');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customDiscount, setCustomDiscount] = useState('');
  // Selected variant id per productId, so choosing a variant on one product in the
  // search results doesn't affect another.
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!isOpen) {
      setTab('catalog');
      setSearchInput('');
      setDebouncedSearch('');
      setCustomTitle('');
      setCustomPrice('');
      setCustomQuantity(1);
      setCustomDiscount('');
      setSelectedVariantByProduct({});
    }
  }, [isOpen]);

  const { data: productRes, isFetching } = useGetProductsQuery(
    { search: debouncedSearch || undefined, limit: 15 },
    { skip: !isOpen || tab !== 'catalog' },
  );
  const products = productRes?.data || [];

  const handleAddCatalogItem = (product: any) => {
    const primaryImage = product.images?.find((img: any) => img.isPrimary) ?? product.images?.[0];
    const variants = (product.variants || []).filter((v: any) => v.isEnabled !== false);
    const selectedVariantId = selectedVariantByProduct[product.id];
    const variant = selectedVariantId ? variants.find((v: any) => v.id === selectedVariantId) : undefined;

    onAdd({
      productId: product.id,
      variantId: variant?.id,
      quantity: 1,
      title: variant?.title ? `${product.title || product.name} (${variant.title})` : product.title || product.name || 'Untitled product',
      unitPrice: Number(variant?.price ?? product.basePrice ?? 0),
      productImageUrl: variant?.image?.url ?? primaryImage?.url ?? null,
      sku: variant?.sku ?? product.variants?.[0]?.sku,
    });
  };

  const handleAddCustomItem = () => {
    const price = Number(customPrice);
    if (!customTitle.trim() || !Number.isFinite(price) || price < 0 || customQuantity < 1) {
      return;
    }
    onAdd({
      isCustomItem: true,
      customTitle: customTitle.trim(),
      customUnitPrice: price,
      quantity: customQuantity,
      discountAmount: Number(customDiscount) || 0,
      title: customTitle.trim(),
      unitPrice: price,
      productImageUrl: null,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Item to Order" icon={<PlusCircle className="w-5 h-5" />} size="lg">
      <div className="px-6 pt-4">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setTab('catalog')}
            className={`flex-1 text-sm font-bold py-2 rounded-md transition-colors ${
              tab === 'catalog' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Search Catalog
          </button>
          <button
            type="button"
            onClick={() => setTab('custom')}
            className={`flex-1 text-sm font-bold py-2 rounded-md transition-colors ${
              tab === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Custom Item
          </button>
        </div>
      </div>

      {tab === 'catalog' ? (
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search products by name..."
              className="bg-transparent text-sm w-full outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1.5">
            {isFetching && <p className="text-sm text-slate-400 text-center py-6">Searching…</p>}
            {!isFetching && products.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">
                {debouncedSearch ? 'No products match your search.' : 'Type to search your catalog.'}
              </p>
            )}
            {!isFetching &&
              products.map((p: any) => {
                const primaryImage = p.images?.find((img: any) => img.isPrimary) ?? p.images?.[0];
                const variants = (p.variants || []).filter((v: any) => v.isEnabled !== false);
                const hasVariants = variants.length > 0;
                const selectedVariantId = selectedVariantByProduct[p.id] ?? '';

                return (
                  <div
                    key={p.id}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                  >
                    {primaryImage?.url ? (
                      <img src={primaryImage.url} alt="" className="w-10 h-10 rounded-md object-cover border border-slate-100 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{p.title || p.name}</p>
                      <p className="text-xs text-slate-500">৳{Number(p.basePrice || 0).toLocaleString()}</p>
                      {hasVariants && (
                        <select
                          value={selectedVariantId}
                          onChange={(e) =>
                            setSelectedVariantByProduct((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1.5 w-full text-xs border border-slate-200 rounded-md px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select variant…</option>
                          {variants.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.title || v.sku || v.id} {v.price != null ? `— ৳${Number(v.price).toLocaleString()}` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddCatalogItem(p)}
                      disabled={hasVariants && !selectedVariantId}
                      className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <ImageOff className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Custom items are never added to your catalog and are not stock-tracked — use this for one-off charges like gift wrapping or a manual adjustment.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Item Name</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Gift wrapping"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Unit Price (৳)</label>
              <input
                type="number"
                min={0}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={customQuantity}
                onChange={(e) => setCustomQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Line Discount (৳, optional)</label>
            <input
              type="number"
              min={0}
              value={customDiscount}
              onChange={(e) => setCustomDiscount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCustomItem}
            disabled={!customTitle.trim() || !customPrice}
            className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Custom Item
          </button>
        </div>
      )}
    </Modal>
  );
}
