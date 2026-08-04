'use client';

import React, { useState } from 'react';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { useGetCategoriesQuery } from '@/features/catalog/api/catalogApi';
import { CreateProductModal } from '@/features/catalog/components/CreateProductModal';
import { ProductListTable } from '@/features/catalog/components/ProductListTable';
import { Plus } from 'lucide-react';

export default function ProductsPage() {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const { data: store } = useGetMyStoreQuery();
  const { data: categories = [] } = useGetCategoriesQuery(undefined, { skip: !store });

  return (
    <div className="space-y-6">
      <CreateProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Products & Catalog Management</h1>
          <p className="text-xs text-slate-500 mt-1">Manage product titles, categories, pricing, SKUs, and images for {store?.name}.</p>
        </div>

        <button
          onClick={() => setIsProductModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Product</span>
        </button>
      </div>

      {/* Categories Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categories:</span>
          {categories.map((cat) => (
            <span key={cat.id} className="px-3 py-1 bg-white border border-slate-200 text-slate-800 font-bold text-xs rounded-full shadow-sm">
              {cat.name}
            </span>
          ))}
        </div>
      )}

      <ProductListTable onAddProductClick={() => setIsProductModalOpen(true)} />
    </div>
  );
}
