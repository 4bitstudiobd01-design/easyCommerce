'use client';

import React, { useMemo } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import {
  useGetProductsQuery,
  type Product,
} from '@/features/catalog/api/catalogApi';
import { CustomDropdown, DropdownOption } from './CustomDropdown';

export interface LineItemDraft {
  key: string;
  productId: string;
  productName: string;
  variantId?: string;
  sku?: string;
  quantity: number;
  unitCost: number;
}

interface LineItemEditorProps {
  value: LineItemDraft[];
  onChange: (lines: LineItemDraft[]) => void;
}

let keySeq = 0;
const nextKey = () => `line-${Date.now()}-${keySeq++}`;

export function makeEmptyLine(): LineItemDraft {
  return {
    key: nextKey(),
    productId: '',
    productName: '',
    variantId: undefined,
    sku: undefined,
    quantity: 1,
    unitCost: 0,
  };
}

const money = (n: number) =>
  `৳\u00A0${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function LineItemEditor({ value, onChange }: LineItemEditorProps) {
  const { data: productsResp } = useGetProductsQuery(
    {
      limit: 100,
      status: 'ACTIVE',
    },
    { refetchOnMountOrArgChange: true },
  );
  const products: Product[] = productsResp?.data ?? [];

  const productOptions = useMemo<DropdownOption[]>(() => {
    return products.map((p) => {
      const rawTitle = p.name ?? p.title ?? 'Product';
      return {
        value: p.id,
        label: rawTitle,
        subtitle: p.sku ? `SKU: ${p.sku}` : undefined,
        badge: p.costPrice !== undefined ? `৳${Number(p.costPrice).toFixed(0)}` : undefined,
        badgeColor: 'bg-slate-100 text-slate-700 font-mono',
        icon: <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
      };
    });
  }, [products]);

  const grandTotal = useMemo(
    () => value.reduce((sum, l) => sum + l.quantity * l.unitCost, 0),
    [value],
  );

  const update = (key: string, patch: Partial<LineItemDraft>) => {
    onChange(value.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const addLine = () => onChange([...value, makeEmptyLine()]);
  const removeLine = (key: string) =>
    onChange(value.filter((l) => l.key !== key));

  const applyProduct = (key: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      update(key, { productId: '', productName: '', variantId: undefined, sku: undefined });
      return;
    }
    update(key, {
      productId: product.id,
      productName: product.name ?? product.title ?? 'Product',
      variantId: undefined,
      sku: product.sku,
      unitCost: product.costPrice ?? 0,
    });
  };

  const applyVariant = (key: string, product: Product, variantId: string) => {
    const variant = product.variants?.find((v) => v.id === variantId);
    update(key, {
      variantId: variant?.id,
      sku: variant?.sku ?? product.sku,
      unitCost: variant?.price ?? product.costPrice ?? 0,
    });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200/80">
            <tr>
              <th className="px-3 py-2.5 text-left font-bold min-w-[190px] w-[220px]">Product</th>
              <th className="px-3 py-2.5 text-left font-bold min-w-[110px] w-[130px]">Variant</th>
              <th className="px-3 py-2.5 text-right font-bold min-w-[80px] w-[85px]">Qty</th>
              <th className="px-3 py-2.5 text-right font-bold min-w-[105px] w-[115px]">Unit Cost</th>
              <th className="px-3 py-2.5 text-right font-bold min-w-[110px] w-[120px]">Line Total</th>
              <th className="px-2 py-2.5 w-10 text-center" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {value.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-slate-400 font-medium text-xs"
                >
                  No line items yet. Click &quot;Add line&quot; below to add items.
                </td>
              </tr>
            )}
            {value.map((line) => {
              const product = products.find((p) => p.id === line.productId);
              const variants = product?.variants ?? [];
              const lineTotal = line.quantity * line.unitCost;

              return (
                <tr key={line.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-2.5 py-2 min-w-[190px] w-[220px]">
                    <CustomDropdown
                      size="sm"
                      searchable
                      searchPlaceholder="Search product by title, SKU..."
                      placeholder="Select a product"
                      value={line.productId}
                      fallbackLabel={line.productName}
                      options={productOptions}
                      triggerMaxChars={16}
                      onChange={(val) => applyProduct(line.key, val)}
                    />
                  </td>
                  <td className="px-2.5 py-2 min-w-[110px] w-[130px]">
                    {variants.length > 0 ? (
                      <CustomDropdown
                        size="sm"
                        value={line.variantId ?? ''}
                        placeholder="Base"
                        options={[
                          { value: '', label: 'Base', subtitle: product?.sku },
                          ...variants.map((v) => ({
                            value: v.id,
                            label: v.title || v.sku || 'Variant',
                            subtitle: v.sku ? `SKU: ${v.sku}` : undefined,
                            badge: v.price !== undefined ? `৳${Number(v.price).toFixed(0)}` : undefined,
                            badgeColor: 'bg-slate-100 text-slate-700 font-mono',
                          })),
                        ]}
                        triggerMaxChars={12}
                        onChange={(val) => applyVariant(line.key, product!, val)}
                      />
                    ) : (
                      <span className="text-slate-400 font-medium text-xs px-2 select-none">—</span>
                    )}
                  </td>
                  <td className="px-2.5 py-2 min-w-[80px] w-[85px]">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        update(line.key, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full min-w-[65px] rounded-xl border border-slate-200 px-2 py-1.5 text-right text-xs font-semibold text-slate-800 bg-slate-50/60 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                    />
                  </td>
                  <td className="px-2.5 py-2 min-w-[105px] w-[115px]">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.unitCost}
                      onChange={(e) =>
                        update(line.key, {
                          unitCost: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full min-w-[90px] rounded-xl border border-slate-200 px-2 py-1.5 text-right text-xs font-semibold text-slate-800 bg-slate-50/60 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                    />
                  </td>
                  <td className="px-3 py-2 min-w-[110px] w-[120px] text-right font-bold text-slate-900 font-mono text-xs whitespace-nowrap">
                    <span className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
                      <span className="text-slate-400 font-medium text-[11px]">৳</span>
                      <span>{lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2 w-10 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50 font-bold">
              <td colSpan={4} className="px-3 py-2.5 text-right text-xs text-slate-600">
                Grand total
              </td>
              <td className="px-3 py-2.5 text-right text-xs font-black text-slate-900 font-mono whitespace-nowrap">
                <span className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
                  <span className="text-slate-500 font-bold text-xs">৳</span>
                  <span>{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <button
        type="button"
        onClick={addLine}
        className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition"
      >
        <Plus className="h-4 w-4" />
        Add line
      </button>
    </div>
  );
}

/** True when every line references a product and has a positive quantity. */
export function lineItemsValid(lines: LineItemDraft[]): boolean {
  return (
    lines.length > 0 &&
    lines.every((l) => l.productId && l.quantity >= 1 && l.unitCost >= 0)
  );
}

/** Maps the editor drafts to the API line-input shape. */
export function toLineInputs(lines: LineItemDraft[]) {
  return lines.map((l) => ({
    productId: l.productId,
    variantId: l.variantId,
    quantity: l.quantity,
    unitCost: Number(l.unitCost.toFixed(2)),
  }));
}
