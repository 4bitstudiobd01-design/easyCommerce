'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Plus,
  Minus,
  SlidersHorizontal,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Tag,
  Boxes,
  Loader2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdjustStockMutation,
  useGetInventoryListQuery,
  useGetInventoryDetailsQuery,
  useGetWarehousesQuery,
} from '../api/inventoryApi';

type AdjustmentAction = 'ADD' | 'REMOVE' | 'SET';

const STANDARD_REASONS = [
  'New Stock Received',
  'Damaged Items',
  'Lost Stock',
  'Manual Correction',
  'Inventory Audit / Count',
  'Customer Return',
  'Other',
];

export function StockAdjustmentView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramInventoryId = searchParams.get('inventoryId') || '';
  const paramProductId = searchParams.get('productId') || '';

  const [selectedInventoryId, setSelectedInventoryId] = useState(paramInventoryId);
  const [selectedProductId, setSelectedProductId] = useState(paramProductId);
  const [action, setAction] = useState<AdjustmentAction>('ADD');
  const [quantity, setQuantity] = useState<string>('10');
  const [reasonPreset, setReasonPreset] = useState<string>('New Stock Received');
  const [customReason, setCustomReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Fetch list of inventory items to allow switching/selection if not pre-selected
  const { data: inventoryListRes, isLoading: isLoadingList } = useGetInventoryListQuery(
    { limit: 100 },
  );
  const inventoryItems = inventoryListRes?.data || [];

  // When inventory item changes or initial params load
  useEffect(() => {
    if (paramInventoryId) {
      setSelectedInventoryId(paramInventoryId);
    } else if (paramProductId && inventoryItems.length > 0) {
      const match = inventoryItems.find((item) => item.productId === paramProductId);
      if (match) {
        setSelectedInventoryId(match.id);
        setSelectedProductId(match.productId);
      }
    } else if (!selectedInventoryId && inventoryItems.length > 0) {
      setSelectedInventoryId(inventoryItems[0].id);
      setSelectedProductId(inventoryItems[0].productId);
    }
  }, [paramInventoryId, paramProductId, inventoryItems, selectedInventoryId]);

  // Fetch specific inventory stock details
  const {
    data: stockDetails,
    isLoading: isLoadingDetails,
  } = useGetInventoryDetailsQuery(selectedInventoryId, {
    skip: !selectedInventoryId,
  });

  const [adjustStockMutation, { isLoading: isSubmitting }] = useAdjustStockMutation();

  // Active stock metrics
  const onHand = stockDetails?.quantityOnHand ?? 0;
  const reserved = stockDetails?.quantityReserved ?? 0;
  const available = stockDetails?.availableQuantity ?? Math.max(0, onHand - reserved);
  const allowBackorder = stockDetails?.allowBackorder ?? false;

  // Numeric parsing
  const parsedQty = parseInt(quantity, 10);
  const validQty = !isNaN(parsedQty) && parsedQty >= 0;

  // Before / After Calculation & Live Preview
  const {
    newOnHand,
    newAvailable,
    delta,
    isValid,
    validationError,
  } = useMemo(() => {
    if (!validQty || quantity.trim() === '') {
      return {
        newOnHand: onHand,
        newAvailable: available,
        delta: 0,
        isValid: false,
        validationError: 'Please enter a valid positive integer quantity.',
      };
    }

    if (action === 'ADD') {
      if (parsedQty <= 0) {
        return {
          newOnHand: onHand,
          newAvailable: available,
          delta: 0,
          isValid: false,
          validationError: 'Quantity to add must be greater than zero.',
        };
      }
      const calcOnHand = onHand + parsedQty;
      const calcAvailable = calcOnHand - reserved;
      return {
        newOnHand: calcOnHand,
        newAvailable: calcAvailable,
        delta: parsedQty,
        isValid: true,
        validationError: null,
      };
    }

    if (action === 'REMOVE') {
      if (parsedQty <= 0) {
        return {
          newOnHand: onHand,
          newAvailable: available,
          delta: 0,
          isValid: false,
          validationError: 'Quantity to remove must be greater than zero.',
        };
      }
      if (!allowBackorder && onHand - parsedQty < reserved) {
        return {
          newOnHand: Math.max(0, onHand - parsedQty),
          newAvailable: Math.max(0, onHand - parsedQty - reserved),
          delta: -parsedQty,
          isValid: false,
          validationError: `Stock cannot be reduced below reserved quantity (${reserved} reserved). Maximum allowable removal is ${Math.max(0, onHand - reserved)} units.`,
        };
      }
      const calcOnHand = Math.max(0, onHand - parsedQty);
      const calcAvailable = calcOnHand - reserved;
      return {
        newOnHand: calcOnHand,
        newAvailable: calcAvailable,
        delta: -parsedQty,
        isValid: true,
        validationError: null,
      };
    }

    if (action === 'SET') {
      if (parsedQty < 0) {
        return {
          newOnHand: onHand,
          newAvailable: available,
          delta: 0,
          isValid: false,
          validationError: 'Target stock quantity cannot be negative.',
        };
      }
      if (!allowBackorder && parsedQty < reserved) {
        return {
          newOnHand: parsedQty,
          newAvailable: parsedQty - reserved,
          delta: parsedQty - onHand,
          isValid: false,
          validationError: `Cannot set stock to ${parsedQty} units because ${reserved} units are already reserved for active orders. Minimum allowed is ${reserved}.`,
        };
      }
      const calcOnHand = parsedQty;
      const calcAvailable = calcOnHand - reserved;
      return {
        newOnHand: calcOnHand,
        newAvailable: calcAvailable,
        delta: calcOnHand - onHand,
        isValid: true,
        validationError: null,
      };
    }

    return {
      newOnHand: onHand,
      newAvailable: available,
      delta: 0,
      isValid: false,
      validationError: 'Invalid adjustment type.',
    };
  }, [action, parsedQty, validQty, quantity, onHand, reserved, available, allowBackorder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedInventoryId) {
      setErrorMsg('Please select an inventory item.');
      return;
    }

    if (!isValid) {
      setErrorMsg(validationError || 'Invalid adjustment parameters.');
      return;
    }

    const finalReason = reasonPreset === 'Other' ? customReason.trim() : reasonPreset;
    if (!finalReason) {
      setErrorMsg('Please specify a reason for this stock adjustment.');
      return;
    }

    try {
      await adjustStockMutation({
        inventoryId: selectedInventoryId,
        action,
        quantity: parsedQty,
        reason: finalReason,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      }).unwrap();

      toast.success('Stock adjusted successfully!');
      router.push(`/dashboard/inventory/${selectedInventoryId}`);
    } catch (err: any) {
      const apiMsg = err?.data?.message || err?.message || 'Failed to adjust stock. Please try again.';
      setErrorMsg(apiMsg);
      toast.error(apiMsg);
    }
  };

  const product = stockDetails?.product;
  const variant = stockDetails?.variant;
  const warehouse = stockDetails?.warehouse;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumbs & Title */}
      <div className="space-y-1">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
            Dashboard
          </Link>
          <span>&gt;</span>
          <Link href="/dashboard/inventory" className="hover:text-slate-600 transition-colors">
            Inventory
          </Link>
          <span>&gt;</span>
          {stockDetails && (
            <>
              <Link
                href={`/dashboard/inventory/${stockDetails.id}`}
                className="hover:text-slate-600 transition-colors truncate max-w-[150px]"
              >
                {product?.name || 'Item'}
              </Link>
              <span>&gt;</span>
            </>
          )}
          <span className="text-slate-700 font-semibold">Adjust Stock</span>
        </nav>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => router.back()}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Adjust Stock</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify on-hand physical counts, track audit reasons, and review live inventory projections.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-3 shadow-sm">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product & Current Stock Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Target Product</span>
              </h2>
              {stockDetails && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                  Active
                </span>
              )}
            </div>

            {/* Inventory Item Selector (Dropdown if multiple exist) */}
            {inventoryItems.length > 1 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Item to Adjust
                </label>
                <select
                  value={selectedInventoryId}
                  onChange={(e) => {
                    setSelectedInventoryId(e.target.value);
                    const item = inventoryItems.find((i) => i.id === e.target.value);
                    if (item) setSelectedProductId(item.productId);
                  }}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.productName} {item.variantTitle ? `(${item.variantTitle})` : ''} — Stock: {item.quantityOnHand}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isLoadingDetails ? (
              <div className="animate-pulse space-y-4 pt-2">
                <div className="w-16 h-16 bg-slate-200 rounded-xl mx-auto" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
                <div className="h-20 bg-slate-200 rounded-xl" />
              </div>
            ) : product ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <Package className="w-7 h-7 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                      SKU: {product.sku || '—'}
                    </p>
                    {variant && (
                      <p className="text-xs text-blue-600 font-semibold mt-0.5">
                        Variant: {variant.title}
                      </p>
                    )}
                  </div>
                </div>

                {warehouse && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
                    <WarehouseIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{warehouse.name} ({warehouse.code})</span>
                  </div>
                )}

                {/* Stock Level Cards */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Current
                    </span>
                    <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                      {onHand}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Reserved
                    </span>
                    <span className="text-base font-extrabold text-amber-600 mt-0.5 block">
                      {reserved}
                    </span>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                      Available
                    </span>
                    <span className="text-base font-extrabold text-blue-700 mt-0.5 block">
                      {available}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Center / Right Column: Adjustment Form + Live Preview */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
              {/* 1. Adjustment Type Selector (Radio Cards) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  Adjustment Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Add Stock Card */}
                  <button
                    type="button"
                    onClick={() => setAction('ADD')}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      action === 'ADD'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        action === 'ADD' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">Add Stock</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Increase physical inventory</div>
                    </div>
                  </button>

                  {/* Remove Stock Card */}
                  <button
                    type="button"
                    onClick={() => setAction('REMOVE')}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      action === 'REMOVE'
                        ? 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        action === 'REMOVE' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">Remove Stock</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Decrease physical count</div>
                    </div>
                  </button>

                  {/* Set Stock Card */}
                  <button
                    type="button"
                    onClick={() => setAction('SET')}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      action === 'SET'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        action === 'SET' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">Set Stock</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Set exact quantity</div>
                    </div>
                  </button>
                </div>

                {action === 'SET' && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2.5 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span><strong>Note:</strong> Set Stock replaces the current on-hand quantity.</span>
                  </p>
                )}
              </div>

              {/* 2. Quantity Input */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Quantity (Units) *
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    required
                    min={action === 'SET' ? '0' : '1'}
                    step="1"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="10"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                    Units
                  </span>
                </div>
              </div>

              {/* 3. Reason & Reference Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Adjustment Reason *
                  </label>
                  <select
                    value={reasonPreset}
                    onChange={(e) => setReasonPreset(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  >
                    {STANDARD_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Reference Code <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. PO-1024, ADJ-001"
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Custom Reason Field if 'Other' */}
              {reasonPreset === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Custom Reason Detail *
                  </label>
                  <input
                    type="text"
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe reason for adjustment..."
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              )}

              {/* 4. Notes Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Audit Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add additional remarks for this stock movement record..."
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            {/* Live Before / After Preview Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-blue-600" />
                  <span>Live Inventory Projection</span>
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isValid
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {isValid ? 'Projection Valid' : 'Invalid Adjustment'}
                </span>
              </div>

              {/* 3 Step Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Before */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Before Adjustment
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Current Stock:</span>
                    <span className="font-extrabold text-slate-800 text-sm">{onHand}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Available:</span>
                    <span className="font-extrabold text-blue-600 text-sm">{available}</span>
                  </div>
                </div>

                {/* Adjustment Delta */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2 flex flex-col justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Adjustment
                  </span>
                  <span
                    className={`text-xl font-extrabold ${
                      delta > 0
                        ? 'text-emerald-600'
                        : delta < 0
                        ? 'text-rose-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta} Units
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {action === 'SET' ? `Set to ${parsedQty || 0}` : action}
                  </span>
                </div>

                {/* After */}
                <div
                  className={`rounded-xl p-4 border space-y-2 ${
                    isValid
                      ? 'bg-blue-50/50 border-blue-100'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    After Adjustment
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Current Stock:</span>
                    <span className="font-extrabold text-slate-900 text-sm">{newOnHand}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Available:</span>
                    <span
                      className={`font-extrabold text-sm ${
                        isValid ? 'text-blue-700' : 'text-rose-600'
                      }`}
                    >
                      {newAvailable}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Warning Alert */}
              {!isValid && validationError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Adjustment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Adjustment</span>
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
