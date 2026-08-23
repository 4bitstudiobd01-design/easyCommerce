'use client';

import React, { useState } from 'react';
import { X, UserCheck, Sparkles, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Lead, Customer360 } from '../../types/crm.types';

interface ConvertLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadConverted: (customer: Customer360) => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadConverted,
}) => {
  const [createInitialOrder, setCreateInitialOrder] = useState(true);
  const [orderAmount, setOrderAmount] = useState(lead?.estimatedValue ? String(lead.estimatedValue) : '5000');
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'CASH_ON_DELIVERY' | 'BANK'>('BKASH');

  if (!isOpen || !lead) return null;

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();

    const newCustomer: Customer360 = {
      id: `cust-${Date.now()}`,
      tenantId: lead.tenantId,
      storeId: lead.storeId,
      firstName: lead.name.split(' ')[0] || lead.name,
      lastName: lead.name.split(' ').slice(1).join(' ') || '',
      fullName: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: 'ACTIVE',
      source: 'STORE_INQUIRY',
      tags: ['Converted Lead', ...(lead.tags || [])],
      totalSpent: createInitialOrder ? Number(orderAmount) || 0 : 0,
      ordersCount: createInitialOrder ? 1 : 0,
      avgOrderValue: createInitialOrder ? Number(orderAmount) || 0 : 0,
      lastOrderAt: createInitialOrder ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      city: 'Dhaka',
      orders: createInitialOrder
        ? [
            {
              id: `ord-${Date.now()}`,
              orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
              totalAmount: Number(orderAmount) || 0,
              paymentMethod,
              paymentStatus: 'PAID',
              orderStatus: 'PROCESSING',
              itemCount: 1,
              itemsSummary: `Initial Converted Order from Lead inquiry`,
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
    };

    onLeadConverted(newCustomer);
    toast.success(`Lead "${lead.name}" converted to registered Store Customer!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Convert Lead to Customer</h2>
              <p className="text-xs text-slate-500">Promote this deal to an active customer profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleConvert} className="mt-5 space-y-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <p className="font-bold text-slate-900">{lead.name}</p>
            <p className="text-slate-600">{lead.phone} {lead.companyName ? `• ${lead.companyName}` : ''}</p>
            <p className="text-emerald-700 font-extrabold text-xs mt-1">
              Estimated Deal Value: ৳{Number(lead.estimatedValue || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={createInitialOrder}
                onChange={(e) => setCreateInitialOrder(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Automatically create initial store order</span>
            </label>

            {createInitialOrder && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Order Total Amount (BDT)</label>
                  <input
                    type="number"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="BKASH">bKash Merchant Pay</option>
                    <option value="CASH_ON_DELIVERY">Cash on Delivery (COD)</option>
                    <option value="BANK">Bank Transfer / Advance</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Confirm Conversion</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
