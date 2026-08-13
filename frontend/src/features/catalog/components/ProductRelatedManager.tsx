'use client';

import React, { useState } from 'react';
import {
  Product,
  useGetProductsQuery,
  useGetRelatedProductsQuery,
  useAddRelatedProductMutation,
  useRemoveRelatedProductMutation,
  useReorderRelatedProductsMutation,
} from '@/features/catalog/api/catalogApi';
import { Layers, Plus, ArrowUp, ArrowDown, Trash2, Search, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductRelatedManagerProps {
  productId: string;
  currencySymbol?: string;
}

export function ProductRelatedManager({ productId, currencySymbol = '৳' }: ProductRelatedManagerProps) {
  const { data: relations = [], isLoading } = useGetRelatedProductsQuery(productId);
  const [addRelatedProduct, { isLoading: isAdding }] = useAddRelatedProductMutation();
  const [removeRelatedProduct] = useRemoveRelatedProductMutation();
  const [reorderRelatedProducts] = useReorderRelatedProductsMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');

  const { data: searchResults } = useGetProductsQuery(
    { search: searchQuery, limit: 10 },
    { skip: !searchQuery.trim() },
  );

  const availableProducts = (searchResults?.data || []).filter(
    (p) => p.id !== productId && !relations.some((r) => r.relatedProductId === p.id),
  );

  const handleAddRelation = async () => {
    if (!selectedTargetId) {
      toast.error('Select a product to relate.');
      return;
    }

    try {
      await addRelatedProduct({ productId, relatedProductId: selectedTargetId }).unwrap();
      toast.success('Related product linked successfully!');
      setSelectedTargetId('');
      setSearchQuery('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to add related product.');
    }
  };

  const handleRemoveRelation = async (relatedProductId: string) => {
    try {
      await removeRelatedProduct({ productId, relatedProductId }).unwrap();
      toast.success('Related product unlinked.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to remove related product.');
    }
  };

  const handleMove = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= relations.length) return;

    const updatedIds = relations.map((r) => r.relatedProductId);
    const temp = updatedIds[index];
    updatedIds[index] = updatedIds[targetIndex];
    updatedIds[targetIndex] = temp;

    try {
      await reorderRelatedProducts({ productId, relatedProductIds: updatedIds }).unwrap();
    } catch (err: any) {
      toast.error('Failed to reorder related products.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Related Products & Cross-Selling</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select products to recommend as cross-sells or related accessories on storefront
          </p>
        </div>

        <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">
          {relations.length} Linked Items
        </span>
      </div>

      {/* Add Related Product Bar */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search products by name or SKU to add..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
          />

          {searchQuery && availableProducts.length > 0 && (
            <div className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
              {availableProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedTargetId(p.id);
                    setSearchQuery(p.name || p.title || '');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-900">{p.name || p.title}</span>
                  <span className="text-[11px] font-mono text-slate-400">{p.sku || 'No SKU'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={isAdding || !selectedTargetId}
          onClick={handleAddRelation}
          className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>Link Product</span>
        </button>
      </div>

      {/* Linked Related Products List */}
      {isLoading ? (
        <div className="h-24 bg-slate-100 animate-pulse rounded-xl" />
      ) : relations.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
          No related products added yet. Use the search bar above to link cross-sell items.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {relations.map((rel, index) => {
                const target = rel.relatedProduct;
                const imgUrl = target?.images?.[0]?.url;
                const title = target?.name || target?.title || 'Untitled Product';

                return (
                  <tr key={rel.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {imgUrl ? (
                            <img src={imgUrl} alt={title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block truncate">{title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{target?.sku || 'No SKU'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${target?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {target?.status || 'UNKNOWN'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {currencySymbol}{target?.basePrice || 0}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'UP')}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === relations.length - 1}
                          onClick={() => handleMove(index, 'DOWN')}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRelation(rel.relatedProductId)}
                          className="p-1 hover:bg-rose-50 rounded-lg text-rose-600"
                          title="Unlink Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
