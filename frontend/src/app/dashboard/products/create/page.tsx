'use client';

import React, { useState } from 'react';
import {
  useCreateProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
} from '@/features/catalog/api/catalogApi';
import {
  Package,
  Sparkles,
  Barcode,
  Image as ImageIcon,
  Tag,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CreateProductPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: categories = [] } = useGetCategoriesQuery();
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
  
  const router = useRouter();

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await createCategory({ name: newCategoryName }).unwrap();
      setCategoryId(created.id);
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to create category.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!basePrice || Number(basePrice) <= 0) {
      setErrorMsg('Please enter a valid base price.');
      return;
    }

    try {
      await createProduct({
        title,
        description,
        basePrice: Number(basePrice),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
        categoryId: categoryId || undefined,
        imageUrl: imageUrl || undefined,
      }).unwrap();

      toast.success('Product added successfully!');
      router.push('/dashboard/products');
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to create product. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shrink-0">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Add New Product</h1>
              <p className="text-sm text-slate-500 mt-1">List a new item in your store catalog</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Product Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Men's Premium Cotton Polo Shirt"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            {/* Category Select + Add Inline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Category</span>
                </button>
              </div>

              {showAddCategory ? (
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name..."
                    className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={isCreatingCategory}
                    className="px-6 py-3.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                  >
                    Save
                  </button>
                </div>
              ) : null}

              <div className="relative">
                <Tag className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                >
                  <option value="">Select Category (Optional)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Selling Price (৳ BDT)
                </label>
                <div className="relative">
                  <span className="font-extrabold text-slate-400 absolute left-4 top-3.5 text-base">৳</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="1450"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Compare Price (Original)
                </label>
                <div className="relative">
                  <span className="font-extrabold text-slate-400 absolute left-4 top-3.5 text-base">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="1800"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SKU & Image URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  SKU Code
                </label>
                <div className="relative">
                  <Barcode className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SHIRT-POLO-001"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Image URL
                </label>
                <div className="relative">
                  <ImageIcon className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product highlights, size guide, fabric details..."
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
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
                className="flex-1 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 text-lg"
              >
                {isLoading ? (
                  <span>Adding Product...</span>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Save & Publish Product</span>
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
