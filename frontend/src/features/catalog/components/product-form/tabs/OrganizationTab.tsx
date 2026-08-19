'use client';

import React from 'react';
import { FolderTree, Layers, Plus } from 'lucide-react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { formatHierarchicalCategoryOptions } from '@/features/catalog/utils/categoryTreeHelper';

interface OrganizationTabProps {
  form: ProductFormState;
}

export function OrganizationTab({ form }: OrganizationTabProps) {
  const {
    categoryId, setCategoryId,
    categories,
    brandId, setBrandId,
    brands,
    showAddBrand, setShowAddBrand,
    newBrandName, setNewBrandName,
    handleAddBrandInline,
    isCreatingBrand,
    collections,
    selectedCollectionIds,
    toggleCollectionSelect,
    showAddCollection, setShowAddCollection,
    newCollectionName, setNewCollectionName,
    handleAddCollectionInline,
    isCreatingCollection,
    productType, setProductType,
  } = form;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-blue-600" />
            <span>Category & Brand</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Assign category, brand, and collections to this product</p>
        </div>

        {/* Category Select */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Uncategorized</option>
            {formatHierarchicalCategoryOptions(categories).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Select + Inline Add */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Brand</label>
            <button
              type="button"
              onClick={() => setShowAddBrand(!showAddBrand)}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>New Brand</span>
            </button>
          </div>

          {showAddBrand && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 border rounded-xl">
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Brand name..."
                className="flex-1 px-3 py-1.5 bg-white border rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddBrandInline}
                disabled={isCreatingBrand}
                className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          )}

          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">No Brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Collections Multi-Select */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Collections</label>
            <button
              type="button"
              onClick={() => setShowAddCollection(!showAddCollection)}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>New Collection</span>
            </button>
          </div>

          {showAddCollection && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 border rounded-xl">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name..."
                className="flex-1 px-3 py-1.5 bg-white border rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddCollectionInline}
                disabled={isCreatingCollection}
                className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          )}

          {collections.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No collections created yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {collections.map((col) => {
                const isChecked = selectedCollectionIds.includes(col.id);
                return (
                  <label
                    key={col.id}
                    className={`flex items-center gap-2 p-2 border rounded-xl cursor-pointer text-xs transition-all ${
                      isChecked ? 'bg-blue-50/60 border-blue-300 font-bold text-blue-900' : 'bg-slate-50/50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCollectionSelect(col.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{col.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Product Type Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Product Type</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Select how this product will be fulfilled</p>
        </div>

        <div className="space-y-2.5">
          {/* PHYSICAL */}
          <label
            className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
              productType === 'PHYSICAL'
                ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/10'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <input
              type="radio"
              name="productType"
              value="PHYSICAL"
              checked={productType === 'PHYSICAL'}
              onChange={() => setProductType('PHYSICAL')}
              className="mt-0.5 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Physical Product</span>
              <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                Physical inventory item requiring courier shipping or store pick-up.
              </span>
            </div>
          </label>

          {/* DIGITAL */}
          <label
            className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
              productType === 'DIGITAL'
                ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/10'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <input
              type="radio"
              name="productType"
              value="DIGITAL"
              checked={productType === 'DIGITAL'}
              onChange={() => setProductType('DIGITAL')}
              className="mt-0.5 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Digital Product</span>
              <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                Electronically delivered asset, license key, or downloadable file.
              </span>
            </div>
          </label>

          {/* SERVICE */}
          <label
            className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
              productType === 'SERVICE'
                ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/10'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <input
              type="radio"
              name="productType"
              value="SERVICE"
              checked={productType === 'SERVICE'}
              onChange={() => setProductType('SERVICE')}
              className="mt-0.5 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Service</span>
              <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                Professional service, consultation, booking, or task assignment.
              </span>
            </div>
          </label>
        </div>
      </div>
    </>
  );
}
