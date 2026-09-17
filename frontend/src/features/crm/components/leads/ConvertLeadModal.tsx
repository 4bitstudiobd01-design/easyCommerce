'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UserCheck,
  ShoppingBag,
  Trash2,
  Loader2,
  DollarSign,
  Building,
  CheckCircle2,
  Globe,
  Search,
  ChevronDown,
  Package,
  Plus,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Lead, Customer360 } from '../../types/crm.types';
import { useConvertLeadToCustomerMutation } from '../../api/crmApi';
import { useGetProductsQuery } from '@/features/catalog/api/catalogApi';

interface PurchasedItem {
  id: string;
  productId?: string;
  productTitle: string;
  productImage?: string | null;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

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
  const { data: catalogProductsData } = useGetProductsQuery({ limit: 100 }, { skip: !isOpen });
  const catalogProducts = catalogProductsData?.data || [];

  const [items, setItems] = useState<PurchasedItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [wonAmount, setWonAmount] = useState<string>('');
  const [createInitialOrder, setCreateInitialOrder] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'CASH_ON_DELIVERY' | 'BANK'>('BKASH');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [convertLead, { isLoading }] = useConvertLeadToCustomerMutation();

  // Initialize or reset state when lead changes
  useEffect(() => {
    if (lead && isOpen) {
      const initAmount = Number(lead.estimatedValue) || 5000;
      setWonAmount(String(initAmount));
      setItems([]);
      setProductSearch('');
      setIsDropdownOpen(false);
    }
  }, [lead, isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter catalog products based on search input
  const filteredProducts = catalogProducts.filter((p: any) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    const name = (p.title || p.name || '').toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    return name.includes(q) || sku.includes(q);
  });

  const handleAddProduct = (prod: any) => {
    const price = Number(prod.salePrice || prod.basePrice || prod.price || 0);
    const title = prod.title || prod.name || 'Catalog Product';

    // If item already in list, increase quantity
    const existingIndex = items.findIndex((it) => it.productId === prod.id);
    if (existingIndex > -1) {
      setItems((prev) => {
        const updated = [...prev];
        const target = { ...updated[existingIndex] };
        target.quantity += 1;
        target.totalPrice = target.unitPrice * target.quantity;
        updated[existingIndex] = target;

        const newTotal = updated.reduce((sum, it) => sum + it.totalPrice, 0);
        setWonAmount(String(newTotal));
        return updated;
      });
    } else {
      const newItem: PurchasedItem = {
        id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: prod.id,
        productTitle: title,
        productImage: prod.thumbnail || prod.image || prod.primaryImage || null,
        sku: prod.sku,
        quantity: 1,
        unitPrice: price,
        totalPrice: price,
      };

      setItems((prev) => {
        const updated = [...prev, newItem];
        const newTotal = updated.reduce((sum, it) => sum + it.totalPrice, 0);
        setWonAmount(String(newTotal));
        return updated;
      });
    }

    setProductSearch('');
    setIsDropdownOpen(false);
    toast.success(`"${title}" যোগ করা হয়েছে`);
  };

  const handleItemChange = (index: number, field: 'unitPrice' | 'quantity', value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === 'unitPrice') {
        target.unitPrice = Math.max(0, Number(value) || 0);
        target.totalPrice = target.unitPrice * target.quantity;
      } else if (field === 'quantity') {
        target.quantity = Math.max(1, Number(value) || 1);
        target.totalPrice = target.unitPrice * target.quantity;
      }

      updated[index] = target;

      const newTotal = updated.reduce((sum, it) => sum + it.totalPrice, 0);
      setWonAmount(String(newTotal));
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const newTotal = updated.reduce((sum, it) => sum + it.totalPrice, 0);
      setWonAmount(updated.length > 0 ? String(newTotal) : String(lead?.estimatedValue || 0));
      return updated;
    });
  };

  if (!isOpen || !lead) return null;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = Number(wonAmount) || 0;
    if (parsedAmount <= 0) {
      toast.error('অনুগ্রহ করে সঠিক WON ডিল অ্যামাউন্ট দিন (Please enter valid deal amount)');
      return;
    }

    try {
      const formattedItems = items
        .filter((it) => it.productTitle.trim().length > 0)
        .map((it) => ({
          productId: it.productId,
          productTitle: it.productTitle.trim(),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          totalPrice: Number(it.totalPrice) || 0,
        }));

      const res = await convertLead({
        leadId: lead.id,
        wonAmount: parsedAmount,
        createInitialOrder,
        paymentMethod,
        items: formattedItems,
      }).unwrap();

      onLeadConverted(res);
      toast.success(`🎉 লিড "${lead.name}" সফলভাবে WON ও কাস্টমারে কনভার্ট হয়েছে!`);
      onClose();
    } catch (err: any) {
      toast.error('কনভার্ট করা সম্ভব হয়নি। আবার চেষ্টা করুন। (Failed to convert lead)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">ডিল কনফার্মেশন ও কাস্টমারে রূপান্তর (Deal WON)</h2>
              <p className="text-xs text-slate-500">
                {lead.name} • {lead.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleConvert} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Target Lead Info */}
          <div className="p-3.5 bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ক্লায়েন্ট / লিড</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{lead.name}</p>
              <p className="text-slate-600 text-xs mt-0.5 flex items-center gap-1">
                <span>{lead.phone}</span>
                {lead.companyName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Building className="w-3 h-3 text-slate-400" />
                      {lead.companyName}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-[11px]">
              {lead.source}
            </div>
          </div>

          {/* Section 1: Purchased Products (কী কী প্রোডাক্ট নিছে ওরা) with Searchable Dropdown */}
          <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>ক্রয়কৃত প্রোডাক্ট বা আইটেম (Purchased Products / Items)</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{items.length} টি প্রোডাক্ট নির্বাচিত</span>
            </div>

            {/* Searchable Product Dropdown / Combobox */}
            <div ref={dropdownRef} className="relative">
              <div
                onClick={() => setIsDropdownOpen(true)}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 bg-white border rounded-xl shadow-2xs cursor-text transition-all ${
                  isDropdownOpen
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="প্রোডাক্ট খুঁজুন বা ড্রপডাউন থেকে সিলেক্ট করুন (Search by name or SKU)..."
                    className="w-full bg-transparent text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95 duration-100">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      <Package className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                      <p className="text-xs font-semibold">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">সঠিক নাম বা SKU দিয়ে আবার সার্চ করুন</p>
                    </div>
                  ) : (
                    filteredProducts.slice(0, 15).map((p: any) => {
                      const title = p.title || p.name || 'Catalog Product';
                      const price = Number(p.salePrice || p.basePrice || p.price || 0);
                      const isAdded = items.some((it) => it.productId === p.id);

                      return (
                        <div
                          key={p.id}
                          onClick={() => handleAddProduct(p)}
                          className="p-2.5 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                              {p.thumbnail || p.image || p.primaryImage ? (
                                <img
                                  src={p.thumbnail || p.image || p.primaryImage}
                                  alt={title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-700">
                                {title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                {p.sku && <span>SKU: {p.sku}</span>}
                                {p.category?.name && <span>• {p.category.name}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="font-black text-xs text-emerald-700">
                              ৳{price.toLocaleString()}
                            </span>
                            {isAdded && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-extrabold">
                                যুক্ত আছে
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Selected Products List */}
            {items.length === 0 ? (
              <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                <p className="text-xs font-semibold">এখনও কোনো প্রোডাক্ট যোগ করা হয়নি।</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  ওপরের সার্চ বক্স থেকে গ্রাহকের কেনা প্রোডাক্টগুলো বাছাই করুন।
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <div className="col-span-6">প্রোডাক্ট বিবরণ</div>
                  <div className="col-span-2 text-right">একক মূল্য (৳)</div>
                  <div className="col-span-2 text-center">পরিমাণ</div>
                  <div className="col-span-2 text-right">মোট (৳)</div>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="grid grid-cols-12 gap-2 items-center p-2.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs"
                  >
                    <div className="col-span-6 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productTitle} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate" title={item.productTitle}>
                          {item.productTitle}
                        </p>
                        {item.sku && <span className="text-[10px] text-slate-400 block font-mono">SKU: {item.sku}</span>}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-900 text-right focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleItemChange(idx, 'quantity', item.quantity - 1)}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-8 px-1 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleItemChange(idx, 'quantity', item.quantity + 1)}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <span className="font-black text-xs text-slate-900">
                        ৳{item.totalPrice.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="রিমুভ করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Final Won Deal Amount (Editable) */}
          <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-2">
            <label className="font-extrabold text-slate-900 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-950">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                সর্বমোট ডিল ভ্যালু (Total Won Deal Amount in BDT) <span className="text-red-500">*</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500">প্রয়োজনে এডিট করুন</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-emerald-700 text-sm">৳</span>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={wonAmount}
                onChange={(e) => setWonAmount(e.target.value)}
                placeholder="যেমন: 25000"
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-emerald-300 rounded-xl font-black text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <p className="text-[11px] text-emerald-800/90 font-medium">
              💡 নির্বাচিত প্রোডাক্টগুলোর মোট মূল্য অনুযায়ী এই অ্যামাউন্ট স্বয়ংক্রিয়ভাবে হিসাব করা হয়েছে।
            </p>
          </div>

          {/* Section 3: Initial Order & Website Ordering Capability */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800">
              <input
                type="checkbox"
                checked={createInitialOrder}
                onChange={(e) => setCreateInitialOrder(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span>অ্যাডমিন প্যানেল থেকে এই পণ্যগুলোর প্রাথমিক অর্ডার তৈরি করুন (Create Order with Selected Items)</span>
            </label>

            {createInitialOrder && (
              <div className="pt-1">
                <label className="font-bold text-slate-700 block mb-1">পেমেন্ট মেথড (Payment Method)</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs"
                >
                  <option value="BKASH">bKash Merchant Pay</option>
                  <option value="CASH_ON_DELIVERY">Cash on Delivery (COD)</option>
                  <option value="BANK">Bank Transfer / Advance</option>
                </select>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/60 flex items-start gap-2 text-[11px] text-slate-600">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                কনভার্ট করার পর ক্লায়েন্ট তার ফোন নম্বর দিয়ে <strong>ওয়েবসাইট থেকেও সরাসরি নতুন অর্ডার করতে পারবে</strong> অথবা আপনি পরবর্তীতে আরও অর্ডার যুক্ত করে দিতে পারবেন।
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isLoading ? 'কনভার্ট হচ্ছে...' : 'ডিল WON কনফার্ম করুন (Confirm WON)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
