'use client';

import React, { useState, useMemo } from 'react';
import {
  useGetAttributesQuery,
  useGenerateVariantsMutation,
  useUpdateVariantMutation,
  useBulkUpdateVariantsMutation,
  ProductVariant,
  AttributeDefinition,
} from '@/features/catalog/api/catalogApi';
import { Layers, Sparkles, CheckSquare, Square, RefreshCw, Loader2, Save, DollarSign, Boxes, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProductVariantMatrixProps {
  productId?: string;
  hasVariants: boolean;
  onHasVariantsChange: (val: boolean) => void;
  existingVariants?: ProductVariant[];
  basePrice?: number;
  currencySymbol?: string;
}

export function ProductVariantMatrix({
  productId,
  hasVariants,
  onHasVariantsChange,
  existingVariants = [],
  basePrice = 0,
  currencySymbol = '৳',
}: ProductVariantMatrixProps) {
  const { data: allAttributes = [] } = useGetAttributesQuery();

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
  const [bulkStock, setBulkStock] = useState<number | ''>('');
  const [showBulkBar, setShowBulkBar] = useState(false);

  const [generateVariants, { isLoading: isGenerating }] = useGenerateVariantsMutation();
  const [updateVariant, { isLoading: isUpdating }] = useUpdateVariantMutation();
  const [bulkUpdateVariants, { isLoading: isBulkUpdating }] = useBulkUpdateVariantsMutation();

  // Local editing buffer for variants
  const [variantBuffer, setVariantBuffer] = useState<Record<string, Partial<ProductVariant>>>(
    {},
  );

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

  // Calculate Cartesian preview count
  const cartesianCount = useMemo(() => {
    const keys = Object.keys(selectedDimensions);
    if (keys.length === 0) return 0;
    return keys.reduce((acc, key) => acc * (selectedDimensions[key]?.length || 0), 1);
  }, [selectedDimensions]);

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

  const handleBulkApply = async (actionType: 'PRICE' | 'STOCK' | 'ENABLE' | 'DISABLE') => {
    if (!productId || selectedVariantIds.length === 0) return;

    try {
      const patch: any = {
        productId,
        variantIds: selectedVariantIds,
      };

      if (actionType === 'PRICE' && bulkPrice !== '') {
        patch.price = Number(bulkPrice);
      } else if (actionType === 'STOCK' && bulkStock !== '') {
        patch.stockQuantity = Number(bulkStock);
      } else if (actionType === 'ENABLE') {
        patch.isEnabled = true;
      } else if (actionType === 'DISABLE') {
        patch.isEnabled = false;
      }

      const updated = await bulkUpdateVariants(patch).unwrap();
      toast.success(`${updated.length} variants updated in bulk.`);
      setSelectedVariantIds([]);
      setBulkPrice('');
      setBulkStock('');
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Product Variants (Color, Size, RAM, Storage)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-dimensional variant options with individual pricing, SKU, and stock tracking
          </p>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
          <input
            type="checkbox"
            checked={hasVariants}
            onChange={(e) => onHasVariantsChange(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
          />
          <span className="text-xs font-bold text-slate-800">Enable Variants</span>
        </label>
      </div>

      {!hasVariants ? (
        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
          Variants are currently disabled. Enable the toggle above if this product comes in multiple options (e.g. Color &times; Size, RAM &times; Storage).
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dimension Selector Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Select Variant Dimensions & Options</span>
            </h3>

            {variantAttributes.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No variant-enabled attributes found. Ensure attributes have <strong>isVariantOption = true</strong> in Attributes management.
              </p>
            ) : (
              <div className="space-y-4">
                {variantAttributes.map((attr) => {
                  const selectedOpts = selectedDimensions[attr.id] || [];
                  return (
                    <div key={attr.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{attr.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {selectedOpts.length} of {attr.options?.length || 0} selected
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {attr.options?.map((opt) => {
                          const isSelected = selectedOpts.includes(opt.id!);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleOption(attr.id, opt.id!)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                              <span>{opt.label || opt.value}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Generation Bar */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Combinations preview: <strong className="text-blue-700 font-extrabold">{cartesianCount} variants</strong>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || cartesianCount === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Generate {cartesianCount > 0 ? `${cartesianCount} ` : ''}Variants</span>
              </button>
            </div>
          </div>

          {/* Generated Variants Table */}
          {existingVariants.length > 0 && (
            <div className="space-y-3">
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
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
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
                        placeholder="Stock Count..."
                        value={bulkStock}
                        onChange={(e) => setBulkStock(e.target.value !== '' ? Number(e.target.value) : '')}
                        className="px-2.5 py-1.5 bg-white border rounded-lg text-xs w-32"
                      />
                      <button
                        type="button"
                        onClick={() => handleBulkApply('STOCK')}
                        disabled={isBulkUpdating || selectedVariantIds.length === 0}
                        className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Apply Stock
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
                  </div>
                </div>
              )}

              {/* Table Container */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedVariantIds.length === existingVariants.length && existingVariants.length > 0}
                          onChange={toggleSelectAllVariants}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="p-3">Variant Title</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Price ({currencySymbol})</th>
                      <th className="p-3">Compare-at</th>
                      <th className="p-3">Cost ({currencySymbol})</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {existingVariants.map((variant) => {
                      const isSelected = selectedVariantIds.includes(variant.id);
                      const buf = variantBuffer[variant.id] || {};
                      const isDirty = Object.keys(buf).length > 0;

                      return (
                        <tr key={variant.id} className={!variant.isEnabled ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50/50'}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                setSelectedVariantIds((prev) =>
                                  prev.includes(variant.id)
                                    ? prev.filter((id) => id !== variant.id)
                                    : [...prev, variant.id],
                                )
                              }
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                          </td>

                          <td className="p-3 font-bold text-slate-900">
                            {variant.title}
                          </td>

                          <td className="p-3">
                            <input
                              type="text"
                              value={buf.sku !== undefined ? buf.sku : variant.sku || ''}
                              onChange={(e) =>
                                setVariantBuffer((prev) => ({
                                  ...prev,
                                  [variant.id]: { ...prev[variant.id], sku: e.target.value },
                                }))
                              }
                              placeholder="SKU..."
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono w-28"
                            />
                          </td>

                          <td className="p-3">
                            <input
                              type="number"
                              step="0.01"
                              value={buf.price !== undefined ? buf.price : variant.price ?? basePrice}
                              onChange={(e) =>
                                setVariantBuffer((prev) => ({
                                  ...prev,
                                  [variant.id]: { ...prev[variant.id], price: Number(e.target.value) },
                                }))
                              }
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold w-24"
                            />
                          </td>

                          <td className="p-3">
                            <input
                              type="number"
                              step="0.01"
                              value={buf.compareAtPrice !== undefined ? buf.compareAtPrice : variant.compareAtPrice ?? ''}
                              onChange={(e) =>
                                setVariantBuffer((prev) => ({
                                  ...prev,
                                  [variant.id]: { ...prev[variant.id], compareAtPrice: e.target.value !== '' ? Number(e.target.value) : undefined },
                                }))
                              }
                              placeholder="Compare..."
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs w-24"
                            />
                          </td>

                          <td className="p-3">
                            <input
                              type="number"
                              step="0.01"
                              value={buf.costPrice !== undefined ? buf.costPrice : variant.costPrice ?? ''}
                              onChange={(e) =>
                                setVariantBuffer((prev) => ({
                                  ...prev,
                                  [variant.id]: { ...prev[variant.id], costPrice: e.target.value !== '' ? Number(e.target.value) : undefined },
                                }))
                              }
                              placeholder="Cost..."
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs w-24"
                            />
                          </td>

                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const newStatus = buf.isEnabled !== undefined ? !buf.isEnabled : !variant.isEnabled;
                                setVariantBuffer((prev) => ({
                                  ...prev,
                                  [variant.id]: { ...prev[variant.id], isEnabled: newStatus },
                                }));
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                (buf.isEnabled !== undefined ? buf.isEnabled : variant.isEnabled)
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {(buf.isEnabled !== undefined ? buf.isEnabled : variant.isEnabled) ? 'Enabled' : 'Disabled'}
                            </button>
                          </td>

                          <td className="p-3 text-right">
                            {isDirty && (
                              <button
                                type="button"
                                onClick={() => handleSaveVariantRow(variant.id)}
                                disabled={isUpdating}
                                className="px-2.5 py-1 bg-blue-600 text-white font-bold text-xs rounded hover:bg-blue-700"
                              >
                                Save
                              </button>
                            )}
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
