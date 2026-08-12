'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Order } from '@/features/order/api/orderApi';
import { useBookCourierMutation } from '../api/logisticsApi';
import { Truck, X, ShieldCheck, MapPin, Phone, User, Package, CheckCircle2 } from 'lucide-react';

interface BookCourierModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BookCourierModal({ order, isOpen, onClose, onSuccess }: BookCourierModalProps) {
  const [courierProvider, setCourierProvider] = useState<'STEADFAST' | 'PATHAO' | 'PAPERFLY'>('STEADFAST');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [bookCourier, { isLoading }] = useBookCourierMutation();

  if (!isOpen || !order) return null;

  const codAmount = order.paymentStatus === 'PAID' ? 0 : Number(order.grandTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await bookCourier({
        orderId: order.id,
        courierProvider,
        note: note || undefined,
      }).unwrap();

      toast.success('Courier booked successfully.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const message = err?.data?.message || 'Failed to dispatch parcel to courier.';
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Dispatch Order #{order.orderNumber}</h2>
              <p className="text-xs text-slate-500">Book parcel with Bangladeshi Courier Service</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Recipient Details Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>Recipient:</span>
              </span>
              <span className="font-bold text-slate-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Phone:</span>
              </span>
              <span className="font-bold text-slate-900">{order.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Address:</span>
              </span>
              <span className="font-bold text-slate-900 truncate max-w-[200px]">{order.shippingAddress}, {order.city}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900">
              <span>COD Cash Collection Amount:</span>
              <span className="text-blue-600">৳{codAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Courier Selection Radios */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Courier Partner
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                onClick={() => setCourierProvider('STEADFAST')}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  courierProvider === 'STEADFAST'
                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">Steadfast Courier</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Fastest Nationwide</span>
                </div>
                <input type="radio" checked={courierProvider === 'STEADFAST'} readOnly className="w-4 h-4 text-blue-600" />
              </label>

              <label
                onClick={() => setCourierProvider('PATHAO')}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  courierProvider === 'PATHAO'
                    ? 'bg-red-50 border-red-600 ring-2 ring-red-600/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">Pathao Express</span>
                  <span className="text-[10px] text-red-600 font-bold">City Speed</span>
                </div>
                <input type="radio" checked={courierProvider === 'PATHAO'} readOnly className="w-4 h-4 text-blue-600" />
              </label>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Instructions for Delivery Rider (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Fragile items, deliver before 6 PM"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Dispatching Parcel...</span>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Confirm Courier Dispatch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
