'use client';

import React, { useState, useMemo } from 'react';
import {
  useGetAttributesQuery,
  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useDeleteAttributeMutation,
  useAddAttributeOptionMutation,
  useDeleteAttributeOptionMutation,
  useGenerateVariantsMutation,
  useUpdateVariantMutation,
  useDeleteProductVariantMutation,
  useBulkUpdateVariantsMutation,
  ProductVariant,
  AttributeDefinition,
} from '@/features/catalog/api/catalogApi';
import {
  Layers,
  Sliders,
  CheckSquare,
  Square,
  RefreshCw,
  Loader2,
  Save,
  DollarSign,
  Boxes,
  Check,
  AlertCircle,
  Plus,
  X,
  Tag,
  Wand2,
  Trash2,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductVariantMatrixProps {
  productId?: string;
  hasVariants: boolean;
  onHasVariantsChange: (val: boolean) => void;
  existingVariants?: ProductVariant[];
  basePrice?: number;
  currencySymbol?: string;
}

// Common preset options for instant 1-click creation
const PRESET_ATTRIBUTES = [
  {
    name: 'Size',
    optionsText: 'S\nM\nL\nXL\nXXL',
    icon: '👕',
  },
  {
    name: 'Color',
    optionsText: 'Black\nWhite\nRed\nNavy Blue\nOlive Green',
    icon: '🎨',
  },
  {
    name: 'Storage',
    optionsText: '64GB\n128GB\n256GB\n512GB',
    icon: '📱',
  },
  {
    name: 'Shoe Size',
    optionsText: '39\n40\n41\n42\n43\n44',
    icon: '👞',
  },
  {
    name: 'Material',
    optionsText: 'Cotton\nSilk\nLinen\nLeather\nDenim',
    icon: '🧵',
  },
];

export function ProductVariantMatrix({
  productId,
  hasVariants,
  onHasVariantsChange,
  existingVariants = [],
  basePrice = 0,
  currencySymbol = '৳',
}: ProductVariantMatrixProps) {
  const { data: allAttributes = [], refetch: refetchAttributes } = useGetAttributesQuery();
  const [createAttribute, { isLoading: isCreatingAttr }] = useCreateAttributeMutation();
  const [updateAttribute, { isLoading: isUpdatingAttr }] = useUpdateAttributeMutation();
  const [deleteAttribute, { isLoading: isDeletingAttr }] = useDeleteAttributeMutation();
  const [addAttributeOption, { isLoading: isAddingOption }] = useAddAttributeOptionMutation();
  const [deleteAttributeOption] = useDeleteAttributeOptionMutation();

  const [generateVariants, { isLoading: isGenerating }] = useGenerateVariantsMutation();
  const [updateVariant, { isLoading: isUpdatingVariant }] = useUpdateVariantMutation();
  const [deleteProductVariant, { isLoading: isDeletingVariant }] = useDeleteProductVariantMutation();
  const [bulkUpdateVariants, { isLoading: isBulkUpdating }] = useBulkUpdateVariantsMutation();

  // Filter only attributes where isVariantOption = true
  const variantAttributes = useMemo(
    () => allAttributes.filter((attr) => attr.isVariantOption && attr.options && attr.options.length > 0),
    [allAttributes],
  );

  // Selected dimensions state: map attributeId -> array of selected optionIds
  const [selectedDimensions, setSelectedDimensions] = useState<Record<string, string[]>>({});
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);

  // Bulk edit values
  const [bulkPrice, setBulkPrice] = useState<number | ''>('');
  const [bulkComparePrice, setBulkComparePrice] = useState<number | ''>('');
  const [showBulkBar, setShowBulkBar] = useState(false);

  // Inline Create Attribute Modal/Card State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrOptionsText, setNewAttrOptionsText] = useState('');

  // Edit Attribute Modal State
  const [editingAttribute, setEditingAttribute] = useState<AttributeDefinition | null>(null);
  const [editAttrName, setEditAttrName] = useState('');
  const [editAttrOptionsText, setEditAttrOptionsText] = useState('');

  // Inline Quick Add Option for specific attribute (attrId -> input value)
  const [quickOptionInputs, setQuickOptionInputs] = useState<Record<string, string>>({});
  const [activeAddOptionAttrId, setActiveAddOptionAttrId] = useState<string | null>(null);

  // Local editing buffer for variants
  const [variantBuffer, setVariantBuffer] = useState<Record<string, Partial<ProductVariant>>>({});

  // Toggle option selection
  const toggleOption = (attributeId: string, optionId: string) => {
    setSelectedDimensions((prev) => {
      const current = prev[attributeId] || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];

      if (updated.length === 0) {
        const copy = { ...prev };
        delete copy[attributeId];
        return copy;
      }
      return { ...prev, [attributeId]: updated };
    });
  };

  const selectAllOptionsForAttr = (attributeId: string, allOptionIds: string[]) => {
    setSelectedDimensions((prev) => ({
      ...prev,
      [attributeId]: allOptionIds,
    }));
  };

  const deselectAllOptionsForAttr = (attributeId: string) => {
    setSelectedDimensions((prev) => {
      const copy = { ...prev };
      delete copy[attributeId];
      return copy;
    });
  };

  // Calculate Cartesian preview count
  const cartesianCount = useMemo(() => {
    const keys = Object.keys(selectedDimensions);
    if (keys.length === 0) return 0;
    return keys.reduce((acc, key) => acc * (selectedDimensions[key]?.length || 0), 1);
  }, [selectedDimensions]);

  // Handle creating new attribute with options
  const handleCreateAttributeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newAttrName.trim()) {
      toast.error('Please enter an attribute name (e.g. Size or Color)');
      return;
    }

    const options = newAttrOptionsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label) => ({
        label,
        value: label.toLowerCase().replace(/\s+/g, '-'),
      }));

    if (options.length === 0) {
      toast.error('Please enter at least one option value (e.g. S, M, L or Red, Blue)');
      return;
    }

    try {
      const created = await createAttribute({
        name: newAttrName.trim(),
        type: 'SELECT',
        isVariantOption: true,
        isFilterable: true,
        options,
      }).unwrap();

      toast.success(`Attribute "${newAttrName}" created with ${options.length} options!`);

      // Automatically pre-select all options of the new attribute
      if (created?.id && created?.options?.length) {
        const optionIds = created.options.map((o) => o.id).filter(Boolean) as string[];
        setSelectedDimensions((prev) => ({
          ...prev,
          [created.id]: optionIds,
        }));
      }

      setNewAttrName('');
      setNewAttrOptionsText('');
      setShowCreateModal(false);
      refetchAttributes();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create attribute');
    }
  };

  // Open Edit Attribute Modal
  const handleOpenEditAttribute = (attr: AttributeDefinition) => {
    setEditingAttribute(attr);
    setEditAttrName(attr.name);
    setEditAttrOptionsText(attr.options?.map((o) => o.label).join('\n') || '');
  };

  // Handle Save Edit Attribute
  const handleSaveEditAttribute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingAttribute || !editAttrName.trim()) return;

    const options = editAttrOptionsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label) => ({
        label,
        value: label.toLowerCase().replace(/\s+/g, '-'),
      }));

    try {
      await updateAttribute({
        id: editingAttribute.id,
        name: editAttrName.trim(),
        options,
      }).unwrap();

      toast.success(`Attribute "${editAttrName}" updated!`);
      setEditingAttribute(null);
      refetchAttributes();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update attribute');
    }
  };

  // Handle Delete Attribute
  const handleDeleteAttribute = async (attr: AttributeDefinition) => {
    if (!confirm(`Are you sure you want to delete attribute "${attr.name}" and all its options?`)) {
      return;
    }

    try {
      await deleteAttribute(attr.id).unwrap();
      toast.success(`Attribute "${attr.name}" deleted`);
      // Remove from selected dimensions
      setSelectedDimensions((prev) => {
        const copy = { ...prev };
        delete copy[attr.id];
        return copy;
      });
      refetchAttributes();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete attribute');
    }
  };

  // Handle Delete Single Option
  const handleDeleteOption = async (attributeId: string, optionId: string, optionLabel: string) => {
    try {
      await deleteAttributeOption(optionId).unwrap();
      toast.success(`Option "${optionLabel}" removed`);
      // Remove from selected dimensions if selected
      setSelectedDimensions((prev) => {
        const current = prev[attributeId] || [];
        return {
          ...prev,
          [attributeId]: current.filter((id) => id !== optionId),
        };
      });
      refetchAttributes();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to remove option');
    }
  };

  // Handle Preset 1-Click Fill
  const handleApplyPreset = (preset: (typeof PRESET_ATTRIBUTES)[0]) => {
    setNewAttrName(preset.name);
    setNewAttrOptionsText(preset.optionsText);
  };

  // Handle Quick Add Single Option to Existing Attribute
  const handleQuickAddOption = async (attributeId: string) => {
    const text = quickOptionInputs[attributeId]?.trim();
    if (!text) return;

    try {
      const newOpt = await addAttributeOption({
        attributeId,
        label: text,
      }).unwrap();

      toast.success(`Option "${text}" added!`);
      setQuickOptionInputs((prev) => ({ ...prev, [attributeId]: '' }));
      setActiveAddOptionAttrId(null);

      // Automatically select the new option
      if (newOpt?.id) {
        const optId: string = newOpt.id;
        setSelectedDimensions((prev) => {
          const current = prev[attributeId] || [];
          return {
            ...prev,
            [attributeId]: [...current, optId],
          };
        });
      }

      refetchAttributes();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to add option');
    }
  };

  // Generate Matrix
  const handleGenerate = async () => {
    if (!productId) {
      toast.error('Please save basic product information before generating variants.');
      return;
    }

    const keys = Object.keys(selectedDimensions);
    if (keys.length === 0) {
      toast.error('Select at least one variant attribute option.');
      return;
    }

    const payloadDimensions = keys.map((attrId) => ({
      attributeId: attrId,
      optionIds: selectedDimensions[attrId],
    }));

    try {
      const variants = await generateVariants({
        productId,
        dimensions: payloadDimensions,
      }).unwrap();

      toast.success(`${variants.length} variants generated successfully!`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to generate variants.');
    }
  };

  // Save Single Variant Row
  const handleSaveVariantRow = async (variantId: string) => {
    if (!productId) return;
    const patch = variantBuffer[variantId];
    if (!patch) return;

    try {
      await updateVariant({
        productId,
        variantId,
        ...patch,
      }).unwrap();

      toast.success('Variant updated.');
      setVariantBuffer((prev) => {
        const copy = { ...prev };
        delete copy[variantId];
        return copy;
      });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update variant.');
    }
  };

  // Delete Single Variant
  const handleDeleteSingleVariant = async (variantId: string, variantTitle: string) => {
    if (!productId) return;
    if (!confirm(`Delete variant "${variantTitle}"?`)) return;

    try {
      await deleteProductVariant({ productId, variantId }).unwrap();
      toast.success(`Variant "${variantTitle}" deleted.`);
      setSelectedVariantIds((prev) => prev.filter((id) => id !== variantId));
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete variant.');
    }
  };

  // Bulk Delete Variants
  const handleBulkDeleteVariants = async () => {
    if (!productId || selectedVariantIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedVariantIds.length} selected variants?`)) return;

    try {
      for (const variantId of selectedVariantIds) {
        await deleteProductVariant({ productId, variantId }).unwrap();
      }
      toast.success(`${selectedVariantIds.length} variants deleted.`);
      setSelectedVariantIds([]);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete some variants.');
    }
  };

  // Bulk Apply
  const handleBulkApply = async (actionType: 'PRICE' | 'COMPARE_PRICE' | 'ENABLE' | 'DISABLE') => {
    if (!productId || selectedVariantIds.length === 0) return;

    try {
      const patch: any = {
        productId,
        variantIds: selectedVariantIds,
      };

      if (actionType === 'PRICE' && bulkPrice !== '') {
        patch.price = Number(bulkPrice);
      } else if (actionType === 'COMPARE_PRICE' && bulkComparePrice !== '') {
        patch.compareAtPrice = Number(bulkComparePrice);
      } else if (actionType === 'ENABLE') {
        patch.isEnabled = true;
      } else if (actionType === 'DISABLE') {
        patch.isEnabled = false;
      }

      const updated = await bulkUpdateVariants(patch).unwrap();
      toast.success(`${updated.length} variants updated in bulk.`);
      setSelectedVariantIds([]);
      setBulkPrice('');
      setBulkComparePrice('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Bulk update failed.');
    }
  };

  const toggleSelectAllVariants = () => {
    if (selectedVariantIds.length === existingVariants.length) {
      setSelectedVariantIds([]);
    } else {
      setSelectedVariantIds(existingVariants.map((v) => v.id));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header with Enable Switch */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Product Variants (Color, Size, RAM, Storage)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-dimensional variant options with individual pricing, SKU, and stock tracking
          </p>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 transition-all self-start sm:self-auto">
          <input
            type="checkbox"
            checked={hasVariants}
            onChange={(e) => onHasVariantsChange(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-800">Enable Variants</span>
        </label>
      </div>

      {!hasVariants ? (
        <div className="p-8 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-700">Variants are currently disabled</h4>
          <p className="text-[11.5px] text-slate-400 max-w-md mx-auto">
            Enable the checkbox above if this product comes in multiple options (e.g. Color &times; Size, RAM &times; Storage).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dimension Selector Card */}
          <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Select Variant Dimensions & Options</span>
              </h3>

              {/* Add New Attribute Button */}
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Option (e.g. Size, Color)</span>
              </button>
            </div>

            {/* Create Variant Option Modal Dialog */}
            {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                {/* Backdrop click to close */}
                <div
                  className="fixed inset-0"
                  onClick={() => setShowCreateModal(false)}
                />

                <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">Create Variant Option / Dimension</h4>
                        <p className="text-xs text-slate-400">Add a dimension like Size or Color with its values.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* 1-Click Quick Presets */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                        Quick 1-Click Presets:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_ATTRIBUTES.map((preset) => (
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

                    <div className="space-y-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Dimension / Option Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Size, Color, Storage, Material"
                          value={newAttrName}
                          onChange={(e) => setNewAttrName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Option Values / Choices <span className="text-rose-500">*</span>
                          <span className="font-normal text-slate-400 ml-1">(comma or 1 per line)</span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="e.g.&#10;Small&#10;Medium&#10;Large&#10;XL"
                          value={newAttrOptionsText}
                          onChange={(e) => setNewAttrOptionsText(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isCreatingAttr || !newAttrName.trim()}
                      onClick={handleCreateAttributeSubmit}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                      {isCreatingAttr ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Save & Add Option</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Variant Option Modal Dialog */}
            {editingAttribute && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                {/* Backdrop click to close */}
                <div
                  className="fixed inset-0"
                  onClick={() => setEditingAttribute(null)}
                />

                <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden z-10 animate-in zoom-in-95 duration-200">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                        <Edit2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Edit Option & Values ({editingAttribute.name})
                        </h4>
                        <p className="text-xs text-slate-400">Modify attribute name or update option choices.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingAttribute(null)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Attribute Name</label>
                      <input
                        type="text"
                        value={editAttrName}
                        onChange={(e) => setEditAttrName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Options (1 per line or comma-separated)
                      </label>
                      <textarea
                        rows={4}
                        value={editAttrOptionsText}
                        onChange={(e) => setEditAttrOptionsText(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => handleDeleteAttribute(editingAttribute)}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 hover:underline"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Option</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingAttribute(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isUpdatingAttr || !editAttrName.trim()}
                        onClick={handleSaveEditAttribute}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all active:scale-95"
                      >
                        {isUpdatingAttr ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* List of Attributes & Options */}
            {variantAttributes.length === 0 ? (
              <div className="p-6 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  No variant options created yet. Click below to add options like <strong>Size</strong>, <strong>Color</strong>, or <strong>Storage</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Option (Size / Color)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {variantAttributes.map((attr) => {
                  const selectedOpts = selectedDimensions[attr.id] || [];
                  const allOptionIds = attr.options?.map((o) => o.id).filter(Boolean) as string[];
                  const isQuickAddOpen = activeAddOptionAttrId === attr.id;

                  return (
                    <div key={attr.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">{attr.name}</span>
                          <span className="text-[10.5px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                            {selectedOpts.length} of {attr.options?.length || 0} selected
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => selectAllOptionsForAttr(attr.id, allOptionIds)}
                            className="text-blue-600 hover:underline"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => deselectAllOptionsForAttr(attr.id)}
                            className="text-slate-500 hover:underline"
                          >
                            Clear
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setActiveAddOptionAttrId(isQuickAddOpen ? null : attr.id)}
                            className="text-purple-600 hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Value</span>
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditAttribute(attr)}
                            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline"
                            title="Edit attribute name & options"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Edit</span>
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttribute(attr)}
                            className="text-red-500 hover:text-red-700 flex items-center gap-0.5 hover:underline"
                            title="Delete this attribute"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Inline Quick Add Value Form */}
                      {isQuickAddOpen && (
                        <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`New ${attr.name} (e.g. ${attr.name === 'Size' ? 'XXXL' : 'Yellow'})...`}
                            value={quickOptionInputs[attr.id] || ''}
                            onChange={(e) =>
                              setQuickOptionInputs((prev) => ({ ...prev, [attr.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleQuickAddOption(attr.id);
                              }
                            }}
                            className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            type="button"
                            disabled={isAddingOption || !quickOptionInputs[attr.id]?.trim()}
                            onClick={() => handleQuickAddOption(attr.id)}
                            className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            {isAddingOption ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            <span>Add</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveAddOptionAttrId(null)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Chips with Individual Option Delete Button */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {attr.options?.map((opt) => {
                          const isSelected = selectedOpts.includes(opt.id!);
                          return (
                            <div
                              key={opt.id}
                              className={`group inline-flex items-center rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20 ring-2 ring-blue-600/20'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleOption(attr.id, opt.id!)}
                                className="px-3 py-1.5 flex items-center gap-1.5"
                              >
                                {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                                <span>{opt.label || opt.value}</span>
                              </button>

                              {/* Option delete trigger */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOption(attr.id, opt.id!, opt.label || opt.value);
                                }}
                                className={`pr-2 pl-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                                  isSelected ? 'text-blue-200 hover:text-white' : 'text-slate-400 hover:text-red-600'
                                }`}
                                title={`Delete option "${opt.label}"`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Generation Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                Combinations preview:{' '}
                <strong className="text-blue-700 font-extrabold text-sm">
                  {cartesianCount} variant{cartesianCount === 1 ? '' : 's'}
                </strong>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || cartesianCount === 0}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Generate {cartesianCount > 0 ? `${cartesianCount} ` : ''}Variants Matrix</span>
              </button>
            </div>
          </div>

          {/* Generated Variants Table */}
          {existingVariants.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Variant Matrix ({existingVariants.length} Active Variants)
                </h3>

                <button
                  type="button"
                  onClick={() => setShowBulkBar(!showBulkBar)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  {showBulkBar ? 'Hide Bulk Edit' : 'Show Bulk Edit Toolbar'}
                </button>
              </div>

              {/* Bulk Update Toolbar */}
              {showBulkBar && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-blue-900 font-bold">
                    <span>Bulk Edit ({selectedVariantIds.length} Selected)</span>
                    <button
                      type="button"
                      onClick={toggleSelectAllVariants}
                      className="text-blue-700 underline text-[11px]"
                    >
                      {selectedVariantIds.length === existingVariants.length ? 'Deselect All' : 'Select All Variants'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="Price Override..."
                        value={bulkPrice}
                        onChange={(e) => setBulkPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                        className="px-2.5 py-1.5 bg-white border rounded-lg text-xs w-32"
                      />
                      <button
                        type="button"
                        onClick={() => handleBulkApply('PRICE')}
                        disabled={isBulkUpdating || selectedVariantIds.length === 0}
                        className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Apply Price
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="Compare Price..."
                        value={bulkComparePrice}
                        onChange={(e) => setBulkComparePrice(e.target.value !== '' ? Number(e.target.value) : '')}
                        className="px-2.5 py-1.5 bg-white border rounded-lg text-xs w-32"
                      />
                      <button
                        type="button"
                        onClick={() => handleBulkApply('COMPARE_PRICE')}
                        disabled={isBulkUpdating || selectedVariantIds.length === 0}
                        className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Apply Compare
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleBulkApply('ENABLE')}
                        disabled={isBulkUpdating || selectedVariantIds.length === 0}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Enable
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkApply('DISABLE')}
                        disabled={isBulkUpdating || selectedVariantIds.length === 0}
                        className="px-3 py-1.5 bg-slate-600 text-white font-bold text-xs rounded-lg hover:bg-slate-700 disabled:opacity-50"
                      >
                        Disable
                      </button>
                    </div>

                    {/* Bulk Delete Button */}
                    <div className="flex items-center ml-auto">
                      <button
                        type="button"
                        onClick={handleBulkDeleteVariants}
                        disabled={selectedVariantIds.length === 0}
                        className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 disabled:opacity-40 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Selected ({selectedVariantIds.length})</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={
                            selectedVariantIds.length > 0 &&
                            selectedVariantIds.length === existingVariants.length
                          }
                          onChange={toggleSelectAllVariants}
                          className="rounded text-blue-600 border-slate-300"
                        />
                      </th>
                      <th className="p-3">Variant Combination</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Price ({currencySymbol})</th>
                      <th className="p-3">Compare Price ({currencySymbol})</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {existingVariants.map((variant) => {
                      const patch = variantBuffer[variant.id] || {};
                      const isRowSelected = selectedVariantIds.includes(variant.id);
                      const currentPrice = patch.price !== undefined ? patch.price : variant.price;
                      const currentComparePrice =
                        patch.compareAtPrice !== undefined
                          ? patch.compareAtPrice
                          : variant.compareAtPrice || '';
                      const currentSku = patch.sku !== undefined ? patch.sku : variant.sku || '';
                      const isEnabled =
                        patch.isEnabled !== undefined ? patch.isEnabled : variant.isEnabled;
                      const isDirty = Object.keys(patch).length > 0;
                      const variantTitle =
                        variant.title ||
                        (variant.options && variant.options.length > 0
                          ? variant.options.map((o) => o.optionLabel).join(' / ')
                          : 'Default Variant');

                      return (
                        <tr
                          key={variant.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isRowSelected ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isRowSelected}
                              onChange={() =>
                                setSelectedVariantIds((prev) =>
                                  prev.includes(variant.id)
                                    ? prev.filter((id) => id !== variant.id)
                                    : [...prev, variant.id],
                                )
                              }
                              className="rounded text-blue-600 border-slate-300"
                            />
                          </td>
                          <td className="p-3 font-extrabold text-slate-900">
                            {variantTitle}
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={currentSku}
                              onChange={(e) =>
                                setVariantBuffer((prev) => ({
                                  ...prev,
                                  [variant.id]: { ...prev[variant.id], sku: e.target.value },
                                }))
                              }
                              placeholder="e.g. SKU-RED-L"
                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono w-32"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={currentPrice}
                              onChange={(e) =>
                                setVariantBuffer((prev) => ({
                                  ...prev,
                                  [variant.id]: {
                                    ...prev[variant.id],
                                    price: Number(e.target.value),
                                  },
                                }))
                              }
                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs w-24 font-bold"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={currentComparePrice}
                              onChange={(e) =>
                                setVariantBuffer((prev) => ({
                                  ...prev,
                                  [variant.id]: {
                                    ...prev[variant.id],
                                    compareAtPrice: Number(e.target.value),
                                  },
                                }))
                              }
                              placeholder="Optional"
                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs w-24 text-slate-500"
                            />
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() =>
                                setVariantBuffer((prev) => ({
                                  ...prev,
                                  [variant.id]: {
                                    ...prev[variant.id],
                                    isEnabled: !isEnabled,
                                  },
                                }))
                              }
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                                isEnabled
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isEnabled ? 'Active' : 'Disabled'}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isDirty && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveVariantRow(variant.id)}
                                  disabled={isUpdatingVariant}
                                  className="px-2.5 py-1 bg-blue-600 text-white font-bold text-[11px] rounded-lg shadow-sm hover:bg-blue-700 flex items-center gap-1"
                                >
                                  {isUpdatingVariant ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                  <span>Save</span>
                                </button>
                              )}

                              {/* Delete single variant row */}
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleVariant(variant.id, variantTitle)}
                                disabled={isDeletingVariant}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete variant row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
