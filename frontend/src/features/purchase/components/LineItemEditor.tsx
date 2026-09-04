'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import {
  useGetProductsQuery,
  type Product,
} from '@/features/catalog/api/catalogApi';

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
  `৳ ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export function LineItemEditor({ value, onChange }: LineItemEditorProps) {
  const [search, setSearch] = useState('');
  const { data: productsResp, isFetching } = useGetProductsQuery({
    search: search.trim() || undefined,
    limit: 20,
    status: 'ACTIVE',
  });
  const products: Product[] = productsResp?.data ?? [];

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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to add…"
          className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {isFetching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            Loading…
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-[40%]">Product</th>
              <th className="px-3 py-2 text-left font-medium w-[22%]">Variant</th>
              <th className="px-3 py-2 text-right font-medium w-20">Qty</th>
              <th className="px-3 py-2 text-right font-medium w-28">Unit cost</th>
              <th className="px-3 py-2 text-right font-medium w-28">Line total</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {value.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-slate-400"
                >
                  No line items yet. Add one below.
                </td>
              </tr>
            )}
            {value.map((line) => {
              const product = products.find((p) => p.id === line.productId);
              const variants = product?.variants ?? [];
              return (
                <tr key={line.key}>
                  <td className="px-3 py-2">
                    <select
                      value={line.productId}
                      onChange={(e) => applyProduct(line.key, e.target.value)}
                      className="w-full max-w-full truncate rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">
                        {line.productId ? line.productName : 'Select a product'}
                      </option>
                      {line.productId &&
                        !products.some((p) => p.id === line.productId) && (
                          <option value={line.productId}>{line.productName}</option>
                        )}
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name ?? p.title}
                          {p.sku ? ` (${p.sku})` : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {variants.length > 0 ? (
                      <select
                        value={line.variantId ?? ''}
                        onChange={(e) =>
                          applyVariant(line.key, product!, e.target.value)
                        }
                        className="w-full max-w-full truncate rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Base (no variant)</option>
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.title || v.sku || 'Variant'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        update(line.key, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </td>
                  <td className="px-3 py-2">
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
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-slate-700">
                    {money(line.quantity * line.unitCost)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="text-slate-400 hover:text-rose-500"
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
            <tr className="border-t border-slate-200 bg-slate-50">
              <td colSpan={4} className="px-3 py-2 text-right text-sm font-medium text-slate-600">
                Grand total
              </td>
              <td className="px-3 py-2 text-right text-sm font-semibold text-slate-900">
                {money(grandTotal)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <button
        type="button"
        onClick={addLine}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800"
      >
        <Plus className="h-4 w-4" />
        Add line
      </button>
    </div>
  );
}

/** True when every line references a product, a positive quantity and a positive unit cost. */
export function lineItemsValid(lines: LineItemDraft[]): boolean {
  return (
    lines.length > 0 &&
    lines.every((l) => l.productId && l.quantity >= 1 && Number(l.unitCost) > 0)
  );
}

/** Maps the editor drafts to the API line-input shape. */
export function toLineInputs(lines: LineItemDraft[]) {
  return lines.map((l) => ({
    productId: l.productId,
    // Only send a variantId when it's a real id — an empty string fails @IsUUID.
    ...(l.variantId ? { variantId: l.variantId } : {}),
    quantity: l.quantity,
    unitCost: Number(Number(l.unitCost).toFixed(2)),
  }));
}
