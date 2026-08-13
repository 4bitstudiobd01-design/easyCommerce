'use client';

import React, { useState } from 'react';
import {
  useGetWarehousesQuery,
  useGetInventoryStockQuery,
  useCreateStockTransferMutation,
} from '@/features/inventory/api/inventoryApi';
import { useGetProductsQuery, Product } from '@/features/catalog/api/catalogApi';
import { ArrowRightLeft } from 'lucide-react';
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

  const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));

  const sourceStockItems = stockItems.filter((s) => s.warehouseId === fromWarehouseId);
  const selectedStock = sourceStockItems.find((s) => s.productId === productId);

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
      toast.success(`✅ ${quantity} unit(s) of "${productMap.get(productId)?.title}" transferred successfully!`);
      router.push('/dashboard/warehouse-transfers');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Transfer failed. Check available stock.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative p-8 md:p-12 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
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
                onChange={(e) => { setFromWarehouseId(e.target.value); setProductId(''); }}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-purple-700 transition-all"
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
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-purple-700 transition-all"
                required
              >
                <option value="">Select destination warehouse...</option>
                {warehouses.filter((wh) => wh.id !== fromWarehouseId).map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Product to Transfer</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-purple-700 transition-all"
              required
            >
              <option value="">Select product...</option>
              {(fromWarehouseId ? sourceStockItems : stockItems).map((s) => (
                <option key={s.productId} value={s.productId}>
                  {productMap.get(s.productId)?.title || s.productId} (Stock: {s.quantityOnHand})
                </option>
              ))}
            </select>
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
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-purple-700 transition-all"
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
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-purple-700 transition-all"
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
              className="px-8 py-4 bg-purple-700 hover:bg-purple-800 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-700/20 transition-all active:scale-95 flex items-center gap-2"
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
