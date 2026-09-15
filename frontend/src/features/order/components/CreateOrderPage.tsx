'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Plus, Trash2, Package, MapPin, User, FileText, Loader2, Tag, CreditCard, Ticket, Store
} from 'lucide-react';
import { useCreateManualOrderMutation, CreateManualOrderRequest, CreateManualOrderItemRequest } from '../api/orderApi';
import { useGetBranchesQuery } from '@/features/tenant/api/tenantApi';
import { AddOrderItemModal, AddedOrderItem } from './AddOrderItemModal';
import { toast } from 'sonner';

interface EditableLineItem extends CreateManualOrderItemRequest {
  title: string;
  unitPrice: number;
  productImageUrl?: string | null;
  sku?: string;
}

const PAYMENT_METHODS: { value: CreateManualOrderRequest['paymentMethod']; label: string }[] = [
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'BKASH', label: 'bKash' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'SSLCOMMERZ', label: 'Card / SSLCommerz' },
];

export function CreateOrderPage() {
  const router = useRouter();
  const [createManualOrder, { isLoading: isSaving }] = useCreateManualOrderMutation();
  const { data: branches } = useGetBranchesQuery();

  const [formData, setFormData] = useState<Omit<CreateManualOrderRequest, 'items'>>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    city: 'Dhaka',
    area: '',
    thana: '',
    district: '',
    division: '',
    customerNote: '',
    internalNote: '',
    branchId: '',
    paymentMethod: 'COD',
    couponCode: '',
    deliveryFee: 60,
    discountAmount: 0,
  });
  const [items, setItems] = useState<EditableLineItem[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Math.max(0, Number(value)) }));
  };

  const handleItemQuantityChange = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: newQty } : item)));
  };

  const handleItemDiscountChange = (index: number, newDiscount: number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, discountAmount: Math.max(0, newDiscount) } : item)));
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = (added: AddedOrderItem) => {
    if (added.productId) {
      // Same product AND same variant (or both unset) merges into the existing
      // line; a different variant of the same product is a separate line.
      const existsIndex = items.findIndex(
        (i) => i.productId === added.productId && i.variantId === added.variantId,
      );
      if (existsIndex >= 0) {
        handleItemQuantityChange(existsIndex, items[existsIndex].quantity + 1);
        return;
      }
    }
    setItems((prev) => [
      ...prev,
      {
        productId: added.productId,
        variantId: added.variantId,
        isCustomItem: added.isCustomItem,
        customTitle: added.customTitle,
        customUnitPrice: added.customUnitPrice,
        quantity: added.quantity,
        discountAmount: added.discountAmount ?? 0,
        title: added.title,
        unitPrice: added.unitPrice,
        productImageUrl: added.productImageUrl,
        sku: added.sku,
      },
    ]);
  };

  // Preview calculations — mirrors backend OrderCalculationService's per-line discount logic
  let previewSubtotal = 0;
  const hydratedItems = items.map((item) => {
    const lineDiscount = item.discountAmount ?? 0;
    const lineTotal = Math.max(0, item.unitPrice * item.quantity - lineDiscount);
    previewSubtotal += lineTotal;
    return { ...item, lineTotal };
  });

  const previewGrandTotal = Math.max(0, previewSubtotal + formData.deliveryFee - formData.discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Order must have at least one item.');
      return;
    }
    if (!formData.customerName.trim() || !formData.customerPhone.trim() || !formData.shippingAddress.trim()) {
      toast.error('Customer name, phone and shipping address are required.');
      return;
    }

    const payloadItems: CreateManualOrderItemRequest[] = items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      isCustomItem: item.isCustomItem,
      customTitle: item.customTitle,
      customUnitPrice: item.customUnitPrice,
      quantity: item.quantity,
      discountAmount: item.discountAmount ?? 0,
    }));

    try {
      const order = await createManualOrder({
        ...formData,
        couponCode: formData.couponCode?.trim() || undefined,
        branchId: formData.branchId || undefined,
        items: payloadItems,
      }).unwrap();
      toast.success(`Order #${order.orderNumber} created.`);
      router.push(`/dashboard/orders/${order.id}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create order.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Order</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/orders" className="px-4 py-2 bg-white text-slate-700 text-sm font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Order
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          {/* Items Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" /> Order Items
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {hydratedItems.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No items added yet. Click "Add Item" below to get started.</p>
              )}
              {hydratedItems.map((item, index) => (
                <div key={`${item.productId ?? 'custom'}-${index}`} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  {item.productImageUrl ? (
                    <img src={item.productImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      {item.isCustomItem && (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                          <Tag className="w-3 h-3" /> Custom
                        </span>
                      )}
                      {item.sku ? `SKU: ${item.sku} • ` : ''}৳{item.unitPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-400">Discount</label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                      <span className="text-xs text-slate-400">৳</span>
                      <input
                        type="number"
                        min={0}
                        value={item.discountAmount ?? 0}
                        onChange={(e) => handleItemDiscountChange(index, Number(e.target.value))}
                        className="w-14 text-sm font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                    <button type="button" onClick={() => handleItemQuantityChange(index, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded">-</button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button type="button" onClick={() => handleItemQuantityChange(index, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded">+</button>
                  </div>
                  <p className="font-bold text-slate-900 w-24 text-right shrink-0">৳{item.lineTotal.toLocaleString()}</p>
                  <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="pt-2">
                <button type="button" onClick={() => setShowAddItemModal(true)} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-slate-50 border-t border-slate-200 p-5 space-y-4">
              <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">৳{previewSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                <span>Delivery Charge</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">৳</span>
                  <input type="number" name="deliveryFee" value={formData.deliveryFee} onChange={handleNumberChange} className="w-24 px-2 py-1 border border-slate-200 rounded-md text-right font-bold text-slate-900" />
                </div>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-emerald-600">
                <span>Discount Amount</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">-৳</span>
                  <input type="number" name="discountAmount" value={formData.discountAmount} onChange={handleNumberChange} className="w-24 px-2 py-1 border border-emerald-200 rounded-md text-right font-bold text-emerald-900 bg-emerald-50" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900">Grand Total</span>
                <span className="text-2xl font-black text-slate-900">৳{previewGrandTotal.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                A coupon code, if entered, is validated and applied server-side and may adjust the final total shown here.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Customer Details</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                <input required type="text" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="e.g. Rahim Uddin" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                <input required type="text" name="customerPhone" value={formData.customerPhone} onChange={handleChange} placeholder="01700000000" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email (Optional)</label>
                <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Payment</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Payment Method</label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Ticket className="w-3 h-3" /> Coupon Code (Optional)
                </label>
                <input type="text" name="couponCode" value={formData.couponCode} onChange={handleChange} placeholder="e.g. SAVE10" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Store className="w-3 h-3" /> Branch (Optional)
                </label>
                <select name="branchId" value={formData.branchId} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                  <option value="">No branch (online order)</option>
                  {branches?.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Shipping Address</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Full Address</label>
                <textarea required name="shippingAddress" value={formData.shippingAddress} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">City</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Area</label>
                  <input type="text" name="area" value={formData.area} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Thana</label>
                  <input type="text" name="thana" value={formData.thana} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">District</label>
                  <input type="text" name="district" value={formData.district} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Notes</h3>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Customer Note</label>
                <textarea name="customerNote" value={formData.customerNote} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none min-h-[60px]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-600 mb-1 flex items-center gap-1"><Tag className="w-3 h-3"/> Internal Note</label>
                <textarea name="internalNote" value={formData.internalNote} onChange={handleChange} className="w-full px-3 py-2 border border-amber-200 bg-amber-50 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none min-h-[60px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddOrderItemModal isOpen={showAddItemModal} onClose={() => setShowAddItemModal(false)} onAdd={handleAddItem} />
    </form>
  );
}
