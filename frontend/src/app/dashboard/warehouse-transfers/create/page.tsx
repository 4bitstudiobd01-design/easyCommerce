'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useGetWarehousesQuery,
  useGetInventoryStockQuery,
  useCreateStockTransferMutation,
} from '@/features/inventory/api/inventoryApi';
import { useGetProductsQuery, Product } from '@/features/catalog/api/catalogApi';
import { ArrowRightLeft, ArrowLeft, Search, ChevronDown, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CreateWarehouseTransferPage() {
  const router = useRouter();
  
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const { data: stockItems = [] } = useGetInventoryStockQuery();
  const { data: productRes } = useGetProductsQuery();
  const products = productRes?.data || [];
  const [createTransfer, { isLoading: isTransferring }] = useCreateStockTransferMutation();

  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const productPickerRef = useRef<HTMLDivElement>(null);

  const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));

  const getProductLabel = (id: string) => {
    const p = productMap.get(id);
    return p?.name || p?.title || 'Untitled Product';
  };

  const sourceStockItems = stockItems.filter((s) => s.warehouseId === fromWarehouseId);
  const selectedStock = sourceStockItems.find((s) => s.productId === productId);

  const availableStockItems = fromWarehouseId ? sourceStockItems : stockItems;
  const filteredStockItems = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return availableStockItems;
    return availableStockItems.filter((s) => {
      const p = productMap.get(s.productId);
      const name = (p?.name || p?.title || '').toLowerCase();
      const sku = (p?.sku || '').toLowerCase();
      return name.includes(query) || sku.includes(query);
    });
  }, [availableStockItems, productSearch, products]);

  // Close the product picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (productPickerRef.current && !productPickerRef.current.contains(e.target as Node)) {
        setIsProductPickerOpen(false);
      }
    };
    if (isProductPickerOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isProductPickerOpen]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromWarehouseId || !toWarehouseId || !productId || quantity <= 0) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      toast.error('Source and destination warehouses must be different.');
      return;
    }

    try {
      await createTransfer({ fromWarehouseId, toWarehouseId, productId, quantity, notes }).unwrap();
      toast.success(`✅ ${quantity} unit(s) of "${getProductLabel(productId)}" transferred successfully!`);
      router.push('/dashboard/warehouse-transfers');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Transfer failed. Check available stock.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 space-y-4">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative p-8 md:p-12 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-slate-900">Transfer Stock</h1>
            <p className="text-sm text-slate-500 mt-1">Move inventory between warehouses instantly</p>
          </div>
        </div>

        <form onSubmit={handleTransfer} className="space-y-6 font-semibold">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">From Warehouse</label>
              <select
                value={fromWarehouseId}
                onChange={(e) => { setFromWarehouseId(e.target.value); setProductId(''); setProductSearch(''); }}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                required
              >
                <option value="">Select source warehouse...</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">To Warehouse</label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                required
              >
                <option value="">Select destination warehouse...</option>
                {warehouses.filter((wh) => wh.id !== fromWarehouseId).map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div ref={productPickerRef} className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Product to Transfer</label>

            <button
              type="button"
              onClick={() => setIsProductPickerOpen((prev) => !prev)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-base focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all flex items-center justify-between gap-3"
            >
              <span className={productId ? 'text-slate-900 truncate' : 'text-slate-400'}>
                {productId ? getProductLabel(productId) : 'Select product...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isProductPickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProductPickerOpen && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                <div className="p-2 border-b border-slate-100 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product by name or SKU..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto py-1">
                  {filteredStockItems.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-400">No matching products found.</p>
                  ) : (
                    filteredStockItems.map((s) => {
                      const p = productMap.get(s.productId);
                      const label = p?.name || p?.title || 'Untitled Product';
                      const isSelected = s.productId === productId;
                      return (
                        <button
                          key={s.productId}
                          type="button"
                          onClick={() => {
                            setProductId(s.productId);
                            setIsProductPickerOpen(false);
                            setProductSearch('');
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                            isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Package className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="flex-1 truncate font-semibold">{label}</span>
                          {p?.sku && <span className="text-[11px] font-mono text-slate-400 shrink-0">{p.sku}</span>}
                          <span className="text-xs font-bold text-slate-500 shrink-0">Stock: {s.quantityOnHand}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {selectedStock && (
              <p className="text-sm text-slate-500 mt-2">
                Available in source: <span className="font-black text-slate-800">{selectedStock.quantityOnHand} units</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Quantity to Transfer</label>
            <input
              type="number"
              min={1}
              max={selectedStock?.quantityOnHand || 99999}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Transfer Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Restocking for Dhaka warehouse"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTransferring}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <ArrowRightLeft className="w-5 h-5" />
              {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
