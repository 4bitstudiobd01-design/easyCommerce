'use client';

import React, { useState } from 'react';
import {
  FolderTree,
  Layers,
  Plus,
  Sliders,
  X,
  Tag,
  Wand2,
  Check,
  Loader2,
  FileText,
} from 'lucide-react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { formatHierarchicalCategoryOptions } from '@/features/catalog/utils/categoryTreeHelper';
import { DynamicAttributeField } from '@/features/catalog/components/DynamicAttributeField';
import {
  useGetAttributesQuery,
  useCreateAttributeMutation,
  useAssignCategoryAttributesMutation,
  AttributeType,
} from '@/features/catalog/api/catalogApi';
import { toast } from 'sonner';

interface OrganizationTabProps {
  form: ProductFormState;
}

// 1-Click quick presets for custom specifications
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

export function OrganizationTab({ form }: OrganizationTabProps) {
  const {
    categoryId, setCategoryId,
    categories,
    categoryAttributes,
    attributeValues,
    handleAttributeChange,
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

  const { data: allStoreAttributes = [], refetch: refetchAttributes } = useGetAttributesQuery();
  const [createAttribute, { isLoading: isCreatingAttr }] = useCreateAttributeMutation();
  const [assignCategoryAttributes, { isLoading: isAssigning }] = useAssignCategoryAttributesMutation();

  // Add Custom Field Modal State
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<AttributeType>('TEXT');
  const [fieldDescription, setFieldDescription] = useState('');
  const [fieldOptionsText, setFieldOptionsText] = useState('');

  const handleApplyPreset = (preset: (typeof PRESET_SPEC_ATTRIBUTES)[0]) => {
    setFieldName(preset.name);
    setFieldType(preset.type);
    setFieldOptionsText(preset.optionsText);
    setFieldDescription(preset.description);
  };

  const handleCreateCustomField = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fieldName.trim()) {
      toast.error('Please enter a field name (e.g. Material, Warranty)');
      return;
    }

    let parsedOptions: { label: string; value: string }[] | undefined = undefined;
    if ((fieldType === 'SELECT' || fieldType === 'MULTI_SELECT') && fieldOptionsText.trim()) {
      parsedOptions = fieldOptionsText
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
        name: fieldName.trim(),
        type: fieldType,
        description: fieldDescription.trim() || undefined,
        isRequired: false,
        isFilterable: true,
        isVariantOption: false,
        options: parsedOptions,
      }).unwrap();

      toast.success(`Custom field "${fieldName}" created successfully!`);

      // If category is selected, auto-bind to category
      if (categoryId && created?.id) {
        const currentIds = categoryAttributes.map((a) => a.id);
        if (!currentIds.includes(created.id)) {
          await assignCategoryAttributes({
            categoryId,
            attributeIds: [...currentIds, created.id],
          }).unwrap();
        }
      }

      setShowCustomFieldModal(false);
      setFieldName('');
      setFieldDescription('');
      setFieldOptionsText('');
      refetchAttributes();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create field');
    }
  };

  // Active non-variant attributes to display
  const activeCustomFields = categoryId && categoryAttributes.length > 0
    ? categoryAttributes.filter((a) => !a.isVariantOption)
    : allStoreAttributes.filter((a) => !a.isVariantOption);

  return (
    <>
      {/* 1. Category, Brand & Collections Card */}
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

      {/* 2. Product Specifications & Custom Fields Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Product Specifications & Custom Fields</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Add custom details like Material, Warranty, Voltage, or Country of Origin
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomFieldModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Field</span>
          </button>
        </div>

        {/* Custom Fields Grid */}
        {activeCustomFields.length === 0 ? (
          <div className="p-6 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <p className="text-xs text-slate-500">
              No custom specification fields added yet. Need fields like <strong>Material</strong>, <strong>Warranty</strong>, or <strong>Origin</strong>?
            </p>
            <button
              type="button"
              onClick={() => setShowCustomFieldModal(true)}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Add Field</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {activeCustomFields.map((attr) => (
              <div key={attr.id} className="p-3.5 bg-slate-50/60 border border-slate-200 rounded-xl space-y-1.5">
                <DynamicAttributeField
                  attribute={attr}
                  value={attributeValues[attr.id]}
                  onChange={(val) => handleAttributeChange(attr.id, val)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Field Modal Dialog */}
      {showCustomFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowCustomFieldModal(false)}
          />

          <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Add Product Custom Field</h4>
                  <p className="text-xs text-slate-400">Define a new specification or custom parameter.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomFieldModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Quick 1-Click Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                  Quick 1-Click Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SPEC_ATTRIBUTES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Field Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Material, Warranty, Origin"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Field Type</label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as AttributeType)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                  >
                    <option value="TEXT">Text (Single Line)</option>
                    <option value="NUMBER">Number (Numeric)</option>
                    <option value="SELECT">Select (Dropdown)</option>
                    <option value="MULTI_SELECT">Multi-Select</option>
                    <option value="BOOLEAN">Boolean (Yes / No Toggle)</option>
                    <option value="DATE">Date (Calendar)</option>
                    <option value="URL">URL Link</option>
                  </select>
                </div>
              </div>

              {(fieldType === 'SELECT' || fieldType === 'MULTI_SELECT') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Predefined Options (1 per line or comma-separated)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Cotton&#10;Silk&#10;Linen&#10;Leather"
                    value={fieldOptionsText}
                    onChange={(e) => setFieldOptionsText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Guidance / Placeholder (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100% Organic Egyptian Cotton"
                  value={fieldDescription}
                  onChange={(e) => setFieldDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowCustomFieldModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCreatingAttr || isAssigning || !fieldName.trim()}
                onClick={handleCreateCustomField}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 active:scale-95"
              >
                {isCreatingAttr ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Add Field to Product</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Product Type Card */}
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
