'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, History, SlidersHorizontal, Image as ImageIcon, Warehouse as WarehouseIcon, MapPin, Phone, Star } from 'lucide-react';
import { useGetInventoryDetailsQuery, InventoryStockItem } from '../api/inventoryApi';

export function InventoryDetailsView() {
  const params = useParams();
  const router = useRouter();
  const inventoryId = typeof params?.id === 'string' ? params.id : '';

  const { data: stock, isLoading, isError } = useGetInventoryDetailsQuery(inventoryId, {
    skip: !inventoryId,
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !stock) {
    return notFound();
  }

  const product = stock.product;
  const variant = stock.variant;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold whitespace-nowrap">
            In Stock
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-bold whitespace-nowrap">
            Low Stock
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-bold whitespace-nowrap">
            Out of Stock
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-bold whitespace-nowrap">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory Details</h1>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
            <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
              Dashboard
            </Link>
            <span>&gt;</span>
            <Link href="/dashboard/inventory" className="hover:text-slate-600 transition-colors">
              Inventory
            </Link>
            <span>&gt;</span>
            <span className="text-slate-700 font-semibold truncate max-w-[200px]">
              {product?.sku || stock.id}
            </span>
          </nav>
        </div>

        {/* Top Action Buttons (Mockup 3) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/dashboard/inventory/adjust?productId=${product?.id}`}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Adjust Stock</span>
          </Link>

          <Link
            href={`/dashboard/inventory/${stock.id}/history`}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 transition-all"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>View History</span>
          </Link>
        </div>
      </div>

      {/* Main Detail Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Product Media */}
          <div className="lg:col-span-4 space-y-4">
            <div className="aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-6 overflow-hidden relative group">
              {product?.thumbnail ? (
                <Image
                  src={product.thumbnail}
                  alt={product.name}
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              ) : (
                <ImageIcon className="w-16 h-16 text-slate-300" />
              )}
            </div>

            {/* Warehouse Card */}
            {stock.warehouse && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                    <WarehouseIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">{stock.warehouse.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">{stock.warehouse.code}</p>
                  </div>
                  {stock.warehouse.isDefault && (
                    <span className="ml-auto px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[9px] rounded-full border border-blue-200 flex items-center gap-0.5 shrink-0">
                      <Star className="w-2 h-2 fill-blue-600 text-blue-600" />
                      Default
                    </span>
                  )}
                </div>
                {stock.warehouse.address && (
                  <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>{stock.warehouse.address}</span>
                  </p>
                )}
                {stock.warehouse.phone && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{stock.warehouse.phone}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Details Grid */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{product?.name}</h2>
              {getStatusBadge(stock.status)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SKU</span>
                <p className="text-sm font-semibold text-slate-900">{product?.sku || '—'}</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Variant</span>
                <p className="text-sm font-semibold text-slate-900">{variant?.title || '—'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
                <p className="text-sm font-semibold text-slate-900">{product?.category?.name || 'Uncategorized'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Product Type</span>
                <p className="text-sm font-semibold text-slate-900">{product?.productType || '—'}</p>
              </div>

              <div className="space-y-1 mt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Stock</span>
                <p className="text-base font-extrabold text-emerald-600">{stock.quantityOnHand}</p>
              </div>

              <div className="space-y-1 mt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reserved</span>
                <p className="text-sm font-semibold text-slate-900">{stock.quantityReserved}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available</span>
                <p className="text-sm font-semibold text-slate-900">{stock.availableQuantity}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Threshold</span>
                <p className="text-sm font-semibold text-slate-900">{stock.lowStockThreshold}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Status</span>
                <div className="pt-0.5">{getStatusBadge(stock.status)}</div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Updated</span>
                <p className="text-sm font-semibold text-slate-900">{formatDate(stock.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
