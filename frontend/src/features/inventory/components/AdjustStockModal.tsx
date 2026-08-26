'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  useAdjustStockMutation,
  useGetWarehousesQuery,
} from '../api/inventoryApi';
import { useGetProductsQuery } from '@/features/catalog/api/catalogApi';
import {
  Boxes,
  Plus,
  Minus,
  SlidersHorizontal,
  X,
  Sparkles,
  ArrowRight,
  Warehouse as WarehouseIcon,
  Package,
} from 'lucide-react';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string;
}

export function AdjustStockModal({
  isOpen,
  onClose,
  initialProductId,
}: AdjustStockModalProps) {
  const [productId, setProductId] = useState(initialProductId || '');
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [action, setAction] = useState<'ADD' | 'SET' | 'REMOVE'>('ADD');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: productRes } = useGetProductsQuery();
  const products = productRes?.data || [];
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const [adjustStock, { isLoading }] = useAdjustStockMutation();

  if (!isOpen) return null;

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
        reason: 'Manual Adjustment',
      }).unwrap();

      toast.success('Stock level updated.');
      onClose();

    } catch (err: any) {
      const message = err?.data?.message || 'Failed to adjust stock level.';
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden relative">
        {/* Top Accent Bar */}
        <div className="h-2 bg-blue-600"></div>

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Adjust Inventory Stock</h2>
                <p className="text-xs text-slate-500 mt-0.5">Physical stock count control per warehouse</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Select Product
              </label>
              <div className="relative">
                <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Warehouse Location
              </label>
              <div className="relative">
                <WarehouseIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
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
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAction('ADD')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    action === 'ADD'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stock</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAction('SET')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    action === 'SET'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Set Exact</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAction('REMOVE')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    action === 'REMOVE'
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Reduce</span>
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Quantity Units
              </label>
              <input
                type="number"
                required
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="50"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Updating Stock Level...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Stock Adjustment</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
