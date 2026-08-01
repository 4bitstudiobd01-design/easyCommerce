'use client';

import React, { useState } from 'react';
import { useLazyTrackPublicOrderQuery, PublicOrderTracking } from '@/features/order/api/orderApi';
import { StorefrontNavbar } from '@/features/storefront/components/StorefrontNavbar';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function OrderTrackingPage() {
  const [query, setQuery] = useState('');
  const [triggerTrack, { data: trackingResults = [], isLoading, isError, error }] = useLazyTrackPublicOrderQuery();
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    triggerTrack(query.trim());
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'CONFIRMED':
        return 2;
      case 'PROCESSING':
        return 3;
      case 'SHIPPED':
        return 4;
      case 'DELIVERED':
        return 5;
      case 'CANCELLED':
        return 0;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/5 text-slate-900 flex flex-col font-sans">
      <StorefrontNavbar storeName="EasyCommerce Track" />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Search Hero Box */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl border border-slate-800 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold">
              <Truck className="w-4 h-4 text-blue-400" />
              <span>Real-Time Parcel & Order Tracker</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Track Your Purchase & Parcel Delivery
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm">
              Enter your Order Number (e.g. <span className="font-mono text-blue-400 font-bold">ORD-1001</span>) or Phone Number to view live shipment updates.
            </p>

            <form onSubmit={handleSearch} className="pt-4 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Order # (e.g. ORD-1001) or Phone (01700000000)"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
              >
                {isLoading ? (
                  <span>Searching...</span>
                ) : (
                  <>
                    <span>Track Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results Container */}
        {isLoading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-600">Fetching live shipment tracking updates...</p>
          </div>
        )}

        {isError && hasSearched && (
          <div className="bg-white rounded-3xl border border-red-200 p-8 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">No Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {(error as any)?.data?.message || `No purchases found matching "${query}". Please verify your order number or phone number.`}
            </p>
          </div>
        )}

        {trackingResults.length > 0 && (
          <div className="space-y-6">
            {trackingResults.map((order) => {
              const activeStep = getStepIndex(order.orderStatus);

              return (
                <div key={order.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-8">
                  {/* Top Order Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-extrabold text-lg text-blue-600">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 font-bold text-[10px] rounded-full border ${
                            order.orderStatus === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : order.orderStatus === 'CANCELLED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'full' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Grand Total
                        </span>
                        <span className="text-base font-extrabold text-slate-900">
                          ৳{order.grandTotal.toLocaleString()} ({order.paymentMethod})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Stepper Progress Bar */}
                  {order.orderStatus !== 'CANCELLED' ? (
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                        Order Progress Timeline
                      </h4>

                      <div className="grid grid-cols-5 gap-2 text-center relative">
                        {/* Step 1: Placed */}
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${activeStep >= 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-400'}`}>
                            1
                          </div>
                          <span className={`text-[10px] font-bold ${activeStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                            Placed
                          </span>
                        </div>

                        {/* Step 2: Confirmed */}
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${activeStep >= 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-400'}`}>
                            2
                          </div>
                          <span className={`text-[10px] font-bold ${activeStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                            Confirmed
                          </span>
                        </div>

                        {/* Step 3: Processing */}
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${activeStep >= 3 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-400'}`}>
                            3
                          </div>
                          <span className={`text-[10px] font-bold ${activeStep >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                            Processing
                          </span>
                        </div>

                        {/* Step 4: Shipped */}
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${activeStep >= 4 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-400'}`}>
                            4
                          </div>
                          <span className={`text-[10px] font-bold ${activeStep >= 4 ? 'text-slate-900' : 'text-slate-400'}`}>
                            Shipped
                          </span>
                        </div>

                        {/* Step 5: Delivered */}
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ${activeStep >= 5 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-100 text-slate-400'}`}>
                            5
                          </div>
                          <span className={`text-[10px] font-bold ${activeStep >= 5 ? 'text-emerald-700' : 'text-slate-400'}`}>
                            Delivered
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>This order has been cancelled by merchant.</span>
                    </div>
                  )}

                  {/* Courier Parcel Tracking Card */}
                  {order.consignment && (
                    <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-600 text-white rounded-xl">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block">
                              Dispatched via {order.consignment.courierProvider} Courier
                            </span>
                            <span className="text-[10px] text-slate-500">Live Parcel Waybill Code</span>
                          </div>
                        </div>

                        <span className="px-3 py-1 bg-blue-600 text-white font-mono font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20">
                          {order.consignment.trackingCode}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-blue-100/80 flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Courier Shipment Status: <span className="text-blue-600">{order.consignment.status}</span></span>
                        <span>COD Collection: ৳{order.consignment.codAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Purchased Items Table */}
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                      Purchased Items Receipt
                    </h4>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="p-4 bg-slate-50/50 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{item.productTitle}</span>
                            <span className="text-[10px] text-slate-500">
                              Qty: {item.quantity} × ৳{item.price.toLocaleString()}
                            </span>
                          </div>
                          <span className="font-extrabold text-slate-900">
                            ৳{item.totalPrice.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
