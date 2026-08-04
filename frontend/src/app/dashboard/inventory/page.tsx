'use client';

import React, { useState } from 'react';
import { AdjustStockModal } from '@/features/inventory/components/AdjustStockModal';
import { InventoryStockTable } from '@/features/inventory/components/InventoryStockTable';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { SlidersHorizontal } from 'lucide-react';

export default function InventoryPage() {
  const { data: store } = useGetMyStoreQuery();
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [selectedProductIdForStock, setSelectedProductIdForStock] = useState<string | undefined>(undefined);

  const handleOpenStockModal = (prodId?: string) => {
    setSelectedProductIdForStock(prodId);
    setIsAdjustStockModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdjustStockModal
        isOpen={isAdjustStockModalOpen}
        onClose={() => setIsAdjustStockModalOpen(false)}
        initialProductId={selectedProductIdForStock}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Decoupled Inventory Control</h1>
          <p className="text-xs text-slate-500 mt-1">Multi-warehouse physical stock tracking, allocations, and reorder alerts for {store?.name}.</p>
        </div>

        <button
          onClick={() => handleOpenStockModal()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Adjust Stock</span>
        </button>
      </div>

      <InventoryStockTable onAdjustStockClick={(prodId) => handleOpenStockModal(prodId)} />
    </div>
  );
}
