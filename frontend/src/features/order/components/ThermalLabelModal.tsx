'use client';

import React from 'react';
import { Order } from '../api/orderApi';
import { X, Printer, Truck, MapPin, Phone, User, QrCode } from 'lucide-react';

interface ThermalLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export function ThermalLabelModal({ isOpen, onClose, order }: ThermalLabelModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900">4x6 Thermal Shipping Sticker</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sticker</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4x6 Inch Thermal Label Layout Preview Box */}
        <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-slate-300 space-y-3 font-sans text-xs text-slate-900 print:p-0 print:border-none print:shadow-none">
          {/* Header Barcode & Courier Provider */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
            <div>
              <span className="font-black text-base tracking-wider block uppercase">STEADFAST COURIER</span>
              <span className="font-mono text-[10px] font-bold text-slate-500">WAYBILL: ST-{order.orderNumber}</span>
            </div>
            <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-mono font-bold text-xs">
              COD
            </div>
          </div>

          {/* Barcode Simulation Visual */}
          <div className="py-2 text-center border-b border-slate-200">
            <div className="h-10 bg-slate-900/90 rounded w-full flex items-center justify-center font-mono text-white text-[10px] tracking-[0.3em] font-extrabold uppercase">
              ||| |||| || ||||| ||| ||| #{order.orderNumber}
            </div>
            <span className="font-mono text-[10px] font-bold text-slate-600 block mt-1">
              #{order.orderNumber}
            </span>
          </div>

          {/* Recipient Details Box */}
          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 block">
              RECIPIENT / DELIVER TO:
            </span>
            <span className="font-extrabold text-sm text-slate-900 block">{order.customerName}</span>
            <span className="font-mono font-bold text-xs text-blue-600 block">{order.customerPhone}</span>
            <p className="text-xs font-semibold text-slate-700 leading-snug">
              {order.shippingAddress}, {order.city}
            </p>
          </div>

          {/* COD Collect Amount Banner */}
          <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-extrabold text-[10px] uppercase tracking-wider text-emerald-800 block">
                CASH TO COLLECT (COD)
              </span>
              <span className="text-xl font-black text-emerald-900">
                ৳{order.grandTotal.toLocaleString()}
              </span>
            </div>
            <span className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg">
              {order.paymentMethod}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
