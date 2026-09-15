'use client';

import React from 'react';
import { Boxes, Barcode } from 'lucide-react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';

interface InventoryTabProps {
  form: ProductFormState;
}

export function InventoryTab({ form }: InventoryTabProps) {
  const {
    trackInventory, setTrackInventory,
    sku, setSku,
    barcode, setBarcode,
    initialStock, setInitialStock,
    lowStockThreshold, setLowStockThreshold,
    allowBackorder, setAllowBackorder,
  } = form;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <span>Inventory, SKU & Stock Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage stock tracking, SKU, barcode, and initial stock quantities</p>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <input
            type="checkbox"
            checked={trackInventory}
            onChange={(e) => setTrackInventory(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
          />
          <span className="text-xs font-bold text-slate-800">Track Inventory</span>
        </label>
      </div>

      {/* SKU & Barcode Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            SKU (Stock Keeping Unit)
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="e.g. TS-BLK-001"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">Store-unique identifier code</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
            <Barcode className="w-3.5 h-3.5 text-slate-400" />
            <span>Barcode (UPC / EAN / GTIN)</span>
          </label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="e.g. 8940001234567"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">Optional product barcode number</p>
        </div>
      </div>

      {/* Stock Quantities Row (If Track Inventory Enabled) */}
      {trackInventory && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Initial Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value !== '' ? Number(e.target.value) : '')}
              placeholder="100"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Initial physical stock count on creation</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Triggers Low Stock status when stock &le; threshold</p>
          </div>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowBackorder}
                onChange={(e) => setAllowBackorder(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800">
                Allow customers to purchase when out of stock (Allow Backorders)
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
