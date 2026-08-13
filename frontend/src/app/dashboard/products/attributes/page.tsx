'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useGetAttributesQuery,
  useCreateAttributeMutation,
  useGetCategoriesQuery,
  useAssignCategoryAttributesMutation,
  AttributeType,
} from '@/features/catalog/api/catalogApi';
import { Sliders, Plus, ArrowLeft, Loader2, FolderTree, Tag, Check, X, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function AttributesManagementPage() {
  const { data: attributes = [], isLoading, refetch } = useGetAttributesQuery();
  const { data: categories = [] } = useGetCategoriesQuery();

  const [createAttribute, { isLoading: isCreating }] = useCreateAttributeMutation();
  const [assignCategoryAttributes, { isLoading: isAssigning }] = useAssignCategoryAttributesMutation();

  // Create Attribute Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [type, setType] = useState<AttributeType>('TEXT');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isFilterable, setIsFilterable] = useState(true);
  const [isVariantOption, setIsVariantOption] = useState(false);
  const [optionsText, setOptionsText] = useState('');

  // Category Binding State
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryAttrIds, setCategoryAttrIds] = useState<string[]>([]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let parsedOptions: { label: string; value: string }[] | undefined = undefined;
    if ((type === 'SELECT' || type === 'MULTI_SELECT') && optionsText.trim()) {
      parsedOptions = optionsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((label) => ({
          label,
          value: label.toLowerCase().replace(/\s+/g, '-'),
        }));
    }

    try {
      await createAttribute({
        name: name.trim(),
        key: key.trim() || undefined,
        type,
        description: description.trim() || undefined,
        isRequired,
        isFilterable,
        isVariantOption,
        options: parsedOptions,
      }).unwrap();

      toast.success(`Attribute "${name}" created successfully!`);
      setShowCreateModal(false);
      setName('');
      setKey('');
      setDescription('');
      setOptionsText('');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create attribute');
    }
  };

  const toggleCategoryAttrSelect = (attrId: string) => {
    setCategoryAttrIds((prev) =>
      prev.includes(attrId) ? prev.filter((id) => id !== attrId) : [...prev, attrId],
    );
  };

  const handleSaveCategoryBindings = async () => {
    if (!selectedCategoryId) return;
    try {
      await assignCategoryAttributes({
        categoryId: selectedCategoryId,
        attributeIds: categoryAttrIds,
      }).unwrap();
      toast.success('Category attribute assignments saved!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save category attributes');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            <span>Attribute & Custom Field Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define universal product attributes (RAM, Storage, Color, Size, Material, ISBN) and bind them to categories.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Attribute</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attributes Table (2 Cols Wide) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Store Attributes ({attributes.length})</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading attributes...</div>
            ) : attributes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <p>No attributes created yet.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Create your first attribute
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Attribute</th>
                      <th className="px-5 py-3">Key</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Flags</th>
                      <th className="px-5 py-3">Options</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {attributes.map((attr) => (
                      <tr key={attr.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{attr.name}</td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{attr.key}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase border border-blue-100">
                            {attr.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 space-x-1">
                          {attr.isRequired && (
                            <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 text-[10px] font-bold rounded">Required</span>
                          )}
                          {attr.isFilterable && (
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">Filterable</span>
                          )}
                          {attr.isVariantOption && (
                            <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 text-[10px] font-bold rounded">Variant</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-[11px] text-slate-500">
                          {attr.options && attr.options.length > 0 ? (
                            <span>{attr.options.map((o) => o.label).join(', ')}</span>
                          ) : (
                            <span className="text-slate-400 font-mono">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Category Attribute Binding Card (1 Col Wide) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-blue-600" />
                <span>Category Attribute Binding</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Bind custom attributes to specific categories</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- Choose Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `└─ ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategoryId && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">Assign Attributes:</label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {attributes.map((attr) => {
                    const isChecked = categoryAttrIds.includes(attr.id);
                    return (
                      <label
                        key={attr.id}
                        className={`flex items-center justify-between p-2.5 border rounded-xl cursor-pointer text-xs transition-all ${
                          isChecked ? 'bg-blue-50/60 border-blue-300 font-bold text-blue-900' : 'bg-slate-50/50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCategoryAttrSelect(attr.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>{attr.name}</span>
                        </span>
                        <span className="text-[10px] uppercase font-mono text-slate-400">{attr.type}</span>
                      </label>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleSaveCategoryBindings}
                  disabled={isAssigning}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Category Binding</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Attribute Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Create Attribute Definition</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attribute Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. RAM, Color, Storage, ISBN"
                  className="w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Key (Optional)</label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g. ram, color"
                    className="w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AttributeType)}
                    className="w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs"
                  >
                    <option value="TEXT">Text</option>
                    <option value="NUMBER">Number</option>
                    <option value="BOOLEAN">Boolean</option>
                    <option value="SELECT">Select</option>
                    <option value="MULTI_SELECT">Multi-Select</option>
                    <option value="DATE">Date</option>
                    <option value="URL">URL</option>
                  </select>
                </div>
              </div>

              {(type === 'SELECT' || type === 'MULTI_SELECT') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Predefined Options (1 per line)
                  </label>
                  <textarea
                    rows={4}
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="Black&#10;White&#10;Blue&#10;Red"
                    className="w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-mono"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Required</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFilterable}
                    onChange={(e) => setIsFilterable(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Filterable</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVariantOption}
                    onChange={(e) => setIsVariantOption(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Variant Option</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center gap-2"
                >
                  {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Attribute</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
