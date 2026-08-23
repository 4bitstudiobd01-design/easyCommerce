'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Plus, Trash2, AlertCircle, Package, MapPin, User, FileText, Loader2, Tag
} from 'lucide-react';
import { useGetOrderByIdQuery, useEditOrderMutation, EditOrderRequest, EditOrderItemRequest, OrderStatusType } from '../api/orderApi';
import { Skeleton } from '@/components/ui/Skeleton';
import { AddOrderItemModal, AddedOrderItem } from './AddOrderItemModal';

interface EditableLineItem extends EditOrderItemRequest {
  title: string;
  unitPrice: number;
  productImageUrl?: string | null;
  sku?: string;
}

interface EditOrderPageProps {
  orderId: string;
}

export function EditOrderPage({ orderId }: EditOrderPageProps) {
  const router = useRouter();
  const { data: order, isLoading: isLoadingOrder, error: orderError } = useGetOrderByIdQuery(orderId);
  const [editOrder, { isLoading: isSaving }] = useEditOrderMutation();

  const [formData, setFormData] = useState<Omit<EditOrderRequest, 'items'>>({
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
    deliveryFee: 60,
    discountAmount: 0,
  });
  const [items, setItems] = useState<EditableLineItem[]>([]);

  const [showAddItemModal, setShowAddItemModal] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        customerEmail: order.customerEmail || '',
        shippingAddress: order.shippingAddress || '',
        city: order.city || 'Dhaka',
        area: order.area || '',
        thana: order.thana || '',
        district: order.district || '',
        division: order.division || '',
        customerNote: order.customerNote || '',
        internalNote: order.internalNote || '',
        deliveryFee: Number(order.deliveryFee) || 0,
        discountAmount: Number(order.discountAmount) || 0,
      });
      setItems(
        order.items?.map((i) => ({
          productId: i.productId ?? undefined,
          isCustomItem: i.isCustomItem,
          customTitle: i.isCustomItem ? i.productTitle : undefined,
          customUnitPrice: i.isCustomItem ? Number(i.unitPrice) : undefined,
          quantity: i.quantity,
          discountAmount: Number(i.discountAmount) || 0,
          title: i.productTitle,
          unitPrice: Number(i.unitPrice),
          productImageUrl: i.productImageUrl,
          sku: i.sku,
        })) || [],
      );
    }
  }, [order]);

  if (isLoadingOrder) {
    return <div className="p-8"><Skeleton className="h-12 w-64 mb-6" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (orderError || !order) {
    return <div className="p-8 text-center text-red-500 font-bold">Failed to load order.</div>;
  }

  const isEditable = ['PENDING', 'ON_HOLD', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus);
  if (!isEditable) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Editable</h2>
        <p className="text-sm text-slate-500 mb-6">
          This order is in a state ({order.orderStatus.replace(/_/g, ' ')}) that cannot be edited.
        </p>
        <button onClick={() => router.push(`/dashboard/orders/${orderId}`)} className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
          Back to Order
        </button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Math.max(0, Number(value)) }));
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
      const existsIndex = items.findIndex((i) => i.productId === added.productId);
      if (existsIndex >= 0) {
        handleItemQuantityChange(existsIndex, items[existsIndex].quantity + 1);
        return;
      }
    }
    setItems((prev) => [
      ...prev,
      {
        productId: added.productId,
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
      alert('Order must have at least one item.');
      return;
    }
    const payloadItems: EditOrderItemRequest[] = items.map((item) => ({
      productId: item.productId,
      isCustomItem: item.isCustomItem,
      customTitle: item.customTitle,
      customUnitPrice: item.customUnitPrice,
      quantity: item.quantity,
      discountAmount: item.discountAmount ?? 0,
    }));
    try {
      await editOrder({ id: orderId, data: { ...formData, items: payloadItems } }).unwrap();
      router.push(`/dashboard/orders/${orderId}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.data?.message || 'Failed to save changes.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href={`/dashboard/orders/${orderId}`} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Order Details
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Edit Order #{order.orderNumber}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/orders/${orderId}`} className="px-4 py-2 bg-white text-slate-700 text-sm font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
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
                <input required type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                <input required type="text" name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Email (Optional)</label>
                <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
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
                <label className="block text-xs font-bold text-amber-600 mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Internal Note</label>
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
