'use client';

import React, { useState } from 'react';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetProductsQuery,
  Category,
} from '../api/catalogApi';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  GripVertical,
  ImageIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Tag,
  FolderPlus,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export function CategoryManagementApp() {
  const { data: categories = [], isLoading, refetch } = useGetCategoriesQuery();
  const { data: products = [] } = useGetProductsQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [image, setImage] = useState('');

  // Parent Categories (categories without parentId)
  const parentCategories = categories.filter((c) => !c.parentId);

  const handleOpenModal = (parentCategory?: Category) => {
    setName('');
    setDescription('');
    setImage('');
    setParentId(parentCategory ? parentCategory.id : '');
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCategory({
        name,
        description,
        parentId: parentId || undefined,
        image: image || undefined,
      }).unwrap();

      toast.success(`Category "${name}" created successfully!`);
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create category.');
    }
  };

  const toggleExpandCategory = (id: string) => {
    if (expandedCategoryId === id) {
      setExpandedCategoryId(null);
    } else {
      setExpandedCategoryId(id);
    }
  };

  // Filtered parent categories
  const filteredParentCategories = parentCategories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="h-8 w-36 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. TOP HEADER TITLE & ACTION BUTTONS */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Categories</h2>

        <div className="flex items-center gap-2">
          {/* Search Toggle Button */}
          <div className="relative">
            {isSearchOpen ? (
              <div className="flex items-center gap-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 w-48 sm:w-64"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-sm"
                title="Search Categories"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* + Add Categories Button */}
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-700/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Categories</span>
          </button>
        </div>
      </div>

      {/* 2. CATEGORIES DATA TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Categories</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Total Subcategory</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredParentCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-400 text-xs">
                    No categories found. Click <span className="font-bold text-purple-700">"+ Add Categories"</span> to create your first category.
                  </td>
                </tr>
              ) : (
                filteredParentCategories.map((cat) => {
                  const subcats = categories.filter((c) => c.parentId === cat.id);
                  const isExpanded = expandedCategoryId === cat.id;

                  return (
                    <React.Fragment key={cat.id}>
                      {/* PARENT ROW */}
                      <tr className="hover:bg-slate-50/70 transition-colors group">
                        {/* Categories Column */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Drag Handle Icon ::: */}
                            <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 cursor-grab shrink-0" />

                            {/* Thumbnail Box */}
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                              {cat.image ? (
                                <img
                                  src={cat.image}
                                  alt={cat.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            {/* Title & Subtitle */}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-purple-600 cursor-pointer" />
                              </div>

                              <span className="text-[11px] text-slate-400 block font-normal mt-0.5">
                                {subcats.length} subcategories
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Total Subcategory Column */}
                        <td className="px-6 py-4 text-center font-bold text-slate-800 text-sm">
                          {subcats.length}
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3 text-slate-400">
                            {/* View / Expand Button */}
                            <button
                              type="button"
                              onClick={() => toggleExpandCategory(cat.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isExpanded ? 'text-purple-700 bg-purple-50' : 'hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title="View / Expand Subcategories"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenModal(cat)}
                              className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Add Subcategory / Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => toast.error(`Deletion for category "${cat.name}" restricted.`)}
                              className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED INLINE SUBCATEGORIES SECTION */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={3} className="bg-slate-50/90 px-10 py-4 border-y border-slate-200/80 animate-in fade-in duration-150">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                                  Subcategories under "{cat.name}"
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleOpenModal(cat)}
                                  className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 shadow-sm"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Subcategory</span>
                                </button>
                              </div>

                              {subcats.length === 0 ? (
                                <p className="text-xs text-slate-400 py-2 italic">
                                  No subcategories yet. Click "+ Add Subcategory" above to add one.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {subcats.map((sub) => (
                                    <div
                                      key={sub.id}
                                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                                        <span className="font-bold text-slate-900 text-xs">{sub.name}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {sub.slug}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. ADD CATEGORIES MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {parentId ? 'Add New Subcategory' : 'Add New Category'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {parentId
                      ? `Creating nested subcategory under "${parentCategories.find((p) => p.id === parentId)?.name || 'Parent'}"`
                      : 'Create a main top-level catalog category'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Category Level
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                >
                  <option value="">Top-Level Main Category (No Parent)</option>
                  {parentCategories.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      Subcategory under "{parent.name}"
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smart Watch & Electronics"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Thumbnail Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary for storefront search"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-700/20 transition-all active:scale-95"
                >
                  {isCreating ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
