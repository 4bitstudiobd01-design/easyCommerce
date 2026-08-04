'use client';

import React, { useState } from 'react';
import { useGetMerchantOrdersQuery } from '@/features/order/api/orderApi';
import { useBookCourierMutation } from '@/features/logistics/api/logisticsApi';
import { Truck, ShieldCheck, MapPin, Phone, User, Package, CheckCircle2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function BookCourierPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [courierProvider, setCourierProvider] = useState<'STEADFAST' | 'PATHAO' | 'PAPERFLY'>('STEADFAST');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: orders = [] } = useGetMerchantOrdersQuery();
  const [bookCourier, { isLoading }] = useBookCourierMutation();

  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 bg-white rounded-3xl border border-slate-200 text-center">
        <h2 className="text-xl font-bold text-slate-900">Order not found</h2>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
          Go Back
        </button>
      </div>
    );
  }

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

      toast.success('Parcel dispatched to courier successfully!');
      router.push('/dashboard/orders');
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to dispatch parcel to courier.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
        {/* Header */}
        <div className="p-8 md:p-10 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shrink-0">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl text-slate-900">Dispatch Order #{order.orderNumber}</h1>
              <p className="text-sm text-slate-500 mt-1">Book parcel with Bangladeshi Courier Service</p>
            </div>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* Recipient Details Card */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <User className="w-4 h-4" />
                <span>Recipient:</span>
              </span>
              <span className="font-bold text-slate-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Phone className="w-4 h-4" />
                <span>Phone:</span>
              </span>
              <span className="font-bold text-slate-900">{order.customerPhone}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium mt-0.5">
                <MapPin className="w-4 h-4" />
                <span>Address:</span>
              </span>
              <span className="font-bold text-slate-900 text-right max-w-xs">{order.shippingAddress}, {order.city}</span>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-200 flex justify-between items-center font-extrabold text-slate-900 text-base">
              <span>COD Cash Collection Amount:</span>
              <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">৳{codAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Courier Selection Radios */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
              Select Courier Partner
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                onClick={() => setCourierProvider('STEADFAST')}
                className={`p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  courierProvider === 'STEADFAST'
                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="font-extrabold text-base text-slate-900 block">Steadfast Courier</span>
                  <span className="text-xs text-emerald-600 font-bold mt-1 block">Fastest Nationwide</span>
                </div>
                <input type="radio" checked={courierProvider === 'STEADFAST'} readOnly className="w-5 h-5 text-blue-600" />
              </label>

              <label
                onClick={() => setCourierProvider('PATHAO')}
                className={`p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  courierProvider === 'PATHAO'
                    ? 'bg-red-50 border-red-600 ring-2 ring-red-600/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="font-extrabold text-base text-slate-900 block">Pathao Express</span>
                  <span className="text-xs text-red-600 font-bold mt-1 block">City Speed</span>
                </div>
                <input type="radio" checked={courierProvider === 'PATHAO'} readOnly className="w-5 h-5 text-blue-600" />
              </label>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
              Instructions for Delivery Rider (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Fragile items, deliver before 6 PM"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Dispatching Parcel...</span>
              ) : (
                <>
                  <Truck className="w-5 h-5" />
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
