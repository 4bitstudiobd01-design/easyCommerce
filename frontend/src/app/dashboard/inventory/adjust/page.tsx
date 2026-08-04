'use client';

import React, { useState } from 'react';
import {
  useAdjustStockMutation,
  useGetWarehousesQuery,
} from '@/features/inventory/api/inventoryApi';
import { useGetProductsQuery } from '@/features/catalog/api/catalogApi';
import {
  Boxes,
  Plus,
  Minus,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  Warehouse as WarehouseIcon,
  Package,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function AdjustStockPage() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get('productId') || '';
  
  const [productId, setProductId] = useState(initialProductId);
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [action, setAction] = useState<'ADD' | 'SET' | 'REMOVE'>('ADD');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: products = [] } = useGetProductsQuery();
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const [adjustStock, { isLoading }] = useAdjustStockMutation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!productId) {
      setErrorMsg('Please select a product.');
      return;
    }

    if (!quantity || Number(quantity) < 0) {
      setErrorMsg('Please enter a valid quantity.');
      return;
    }

    try {
      await adjustStock({
        productId,
        warehouseId: warehouseId || undefined,
        quantity: Number(quantity),
        action,
      }).unwrap();

      toast.success('Stock adjusted successfully!');
      router.push('/dashboard/inventory');
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to adjust stock level.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600"></div>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shrink-0">
              <Boxes className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Adjust Inventory Stock</h1>
              <p className="text-sm text-slate-500 mt-1">Physical stock count control per warehouse</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Product
              </label>
              <div className="relative">
                <Package className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium"
                >
                  <option value="">Choose a product from catalog...</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.title} (৳{prod.basePrice})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Warehouse Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Warehouse Location
              </label>
              <div className="relative">
                <WarehouseIcon className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} {wh.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Radio Group */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Adjustment Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setAction('ADD')}
                  className={`py-4 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                    action === 'ADD'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Stock</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAction('SET')}
                  className={`py-4 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                    action === 'SET'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  <span>Set Exact</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAction('REMOVE')}
                  className={`py-4 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                    action === 'REMOVE'
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Minus className="w-5 h-5" />
                  <span>Reduce</span>
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Quantity Units
              </label>
              <input
                type="number"
                required
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="50"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xl font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 text-lg"
              >
                {isLoading ? (
                  <span>Updating Stock Level...</span>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Save Stock Adjustment</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
