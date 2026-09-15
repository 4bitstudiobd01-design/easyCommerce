'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Plus,
  X,
  Tag,
  Wand2,
  Check,
  Loader2,
  ExternalLink,
  HelpCircle,
  FolderTree,
} from 'lucide-react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { DynamicAttributeField } from '@/features/catalog/components/DynamicAttributeField';
import {
  useGetAttributesQuery,
  useCreateAttributeMutation,
  useAssignCategoryAttributesMutation,
  AttributeType,
} from '@/features/catalog/api/catalogApi';
import { toast } from 'sonner';

interface MoreOptionsTabProps {
  form: ProductFormState;
}

// Common attribute specification presets
const PRESET_SPEC_ATTRIBUTES = [
  {
    name: 'Material / Fabric',
    type: 'SELECT' as AttributeType,
    optionsText: 'Cotton\nSilk\nLinen\nLeather\nDenim\nPolyester\nWool',
    description: 'Fabric or primary material composition',
    icon: '🧵',
  },
  {
    name: 'Warranty Period',
    type: 'SELECT' as AttributeType,
    optionsText: 'No Warranty\n6 Months Replacement\n1 Year Service\n2 Years Official\nLifetime',
    description: 'Warranty coverage details',
    icon: '🛡️',
  },
  {
    name: 'Country of Origin',
    type: 'SELECT' as AttributeType,
    optionsText: 'Bangladesh\nChina\nIndia\nVietnam\nTurkey\nUnited States',
    description: 'Manufacturing country',
    icon: '📍',
  },
  {
    name: 'Care Instructions',
    type: 'TEXT' as AttributeType,
    optionsText: '',
    description: 'e.g. Machine wash cold, dry clean only',
    icon: '🧼',
  },
  {
    name: 'Power & Voltage',
    type: 'TEXT' as AttributeType,
    optionsText: '',
    description: 'e.g. 220V, 50Hz, 15W USB-C',
    icon: '🔌',
  },
  {
    name: 'Package Dimensions',
    type: 'TEXT' as AttributeType,
    optionsText: '',
    description: 'e.g. 25cm x 15cm x 10cm',
    icon: '📦',
  },
];

export function MoreOptionsTab({ form }: MoreOptionsTabProps) {
  const {
    categoryId,
    categoryAttributes,
    attributeValues,
    handleAttributeChange,
  } = form;

  const { data: allStoreAttributes = [], refetch: refetchAttributes } = useGetAttributesQuery();
  const [createAttribute, { isLoading: isCreatingAttr }] = useCreateAttributeMutation();
  const [assignCategoryAttributes, { isLoading: isAssigning }] = useAssignCategoryAttributesMutation();

  // Create Attribute Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AttributeType>('TEXT');
  const [description, setDescription] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isFilterable, setIsFilterable] = useState(true);
  const [isVariantOption, setIsVariantOption] = useState(false);

  const handleApplyPreset = (preset: (typeof PRESET_SPEC_ATTRIBUTES)[0]) => {
    setName(preset.name);
    setType(preset.type);
    setOptionsText(preset.optionsText);
    setDescription(preset.description);
    setIsVariantOption(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Attribute name is required');
      return;
    }

    let parsedOptions: { label: string; value: string }[] | undefined = undefined;
    if ((type === 'SELECT' || type === 'MULTI_SELECT') && optionsText.trim()) {
      parsedOptions = optionsText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((label) => ({
          label,
          value: label.toLowerCase().replace(/\s+/g, '-'),
        }));
    }

    try {
      const created = await createAttribute({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        isRequired,
        isFilterable,
        isVariantOption,
        options: parsedOptions,
      }).unwrap();

      toast.success(`Attribute "${name}" created successfully!`);

      // If a category is selected, auto-bind this new attribute to the current category
      if (categoryId && created?.id) {
        const currentIds = categoryAttributes.map((a) => a.id);
        if (!currentIds.includes(created.id)) {
          await assignCategoryAttributes({
            categoryId,
            attributeIds: [...currentIds, created.id],
          }).unwrap();
        }
      }

      setShowCreateModal(false);
      setName('');
      setDescription('');
      setOptionsText('');
      refetchAttributes();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create attribute');
    }
  };

  // Attributes to render: category-bound attributes, or all attributes if no category
  const activeAttributes = categoryId && categoryAttributes.length > 0
    ? categoryAttributes
    : allStoreAttributes;

  return (
    <div className="space-y-6">
      {/* Attribute Management & Custom Specifications Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <span>Product Attributes & Custom Specifications</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define technical specs, material details, warranty, and category-assigned attributes.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Attribute</span>
            </button>

            <Link
              href="/dashboard/products/attributes"
              target="_blank"
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1 transition-all"
            >
              <span>Manage Global</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Inline Create Attribute Card */}
        {showCreateModal && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-5 bg-gradient-to-br from-blue-50/40 via-white to-purple-50/30 border-2 border-blue-200 rounded-2xl shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Create New Attribute / Specification</h4>
                  <p className="text-[10.5px] text-slate-500">
                    Define a custom specification field for your products.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="space-y-1.5">
              <span className="text-[10.5px] font-bold text-slate-500 flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-purple-600" />
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SPEC_ATTRIBUTES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-all flex items-center gap-1 shadow-xs"
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Attribute Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Material, Warranty, Voltage, Origin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Field Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AttributeType)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="TEXT">Text (Single Line)</option>
                  <option value="NUMBER">Number (Numeric Value)</option>
                  <option value="SELECT">Select (Dropdown Options)</option>
                  <option value="MULTI_SELECT">Multi-Select (Multiple Choices)</option>
                  <option value="BOOLEAN">Boolean (Yes / No Toggle)</option>
                  <option value="DATE">Date (Calendar Date)</option>
                  <option value="URL">URL Link</option>
                </select>
              </div>
            </div>

            {(type === 'SELECT' || type === 'MULTI_SELECT') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Predefined Options (Comma or 1 per line)
                </label>
                <textarea
                  rows={3}
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="Cotton&#10;Silk&#10;Linen&#10;Leather"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Help / Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Guidance shown below field..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Required Field</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFilterable}
                  onChange={(e) => setIsFilterable(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Storefront Filterable</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingAttr || isAssigning || !name.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 active:scale-95"
              >
                {isCreatingAttr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Create & Add to Product</span>
              </button>
            </div>
          </form>
        )}

        {/* Attribute Fields Rendering */}
        {activeAttributes.length === 0 ? (
          <div className="p-8 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700">No attributes configured yet</h4>
              <p className="text-[11.5px] text-slate-400 max-w-md mx-auto mt-0.5">
                Create custom fields like Material, Warranty, Voltage, or Origin to provide comprehensive product details.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create First Attribute</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {categoryId && (
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-blue-900">
                  Showing attributes configured for the selected category.
                </span>
                <Link
                  href="/dashboard/products/attributes"
                  className="font-bold text-blue-700 hover:underline flex items-center gap-1 shrink-0"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Category Bindings</span>
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {activeAttributes.map((attr) => (
                <div key={attr.id} className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl space-y-2">
                  <DynamicAttributeField
                    attribute={attr}
                    value={attributeValues[attr.id]}
                    onChange={(val) => handleAttributeChange(attr.id, val)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
