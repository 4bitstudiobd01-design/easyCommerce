'use client';

import React, { useState } from 'react';
import { Customer360, CustomerNote, CustomerAddress } from '../../types/crm.types';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Clock,
  Sparkles,
  MessageCircle,
  PhoneCall,
  Plus,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
  ShieldCheck,
  User,
  CreditCard,
  FileText,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCrmDate } from '../../utils/formatDate';
import { toast } from 'sonner';

interface CustomerDetailDrawer360Props {
  customer: Customer360 | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickContact?: (customer: Customer360, channel: 'WHATSAPP' | 'CALL' | 'SMS') => void;
}

export const CustomerDetailDrawer360: React.FC<CustomerDetailDrawer360Props> = ({
  customer,
  isOpen,
  onClose,
  onOpenQuickContact,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'timeline' | 'notes' | 'addresses'>('overview');
  const [newNote, setNewNote] = useState('');
  const [notesList, setNotesList] = useState<CustomerNote[]>(customer?.notes || []);
  const [orderPage, setOrderPage] = useState<number>(1);
  const orderPageSize = 5;

  React.useEffect(() => {
    setNotesList(customer?.notes || []);
    setOrderPage(1);
  }, [customer?.id]);

  if (!isOpen || !customer) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const noteObj: CustomerNote = {
      id: `note-${Date.now()}`,
      customerId: customer.id,
      authorName: 'MD Belal Hossain',
      authorRole: 'Merchant Owner',
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
    };

    setNotesList([noteObj, ...notesList]);
    setNewNote('');
    toast.success('Internal customer note logged.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
          
          {/* Top Header Bar */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/30">
                {customer.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">{customer.fullName}</h2>
                  {customer.status === 'GUEST' ? (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-md text-[10px] font-extrabold uppercase">
                      Guest Checkout
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-md text-[10px] font-extrabold uppercase">
                      Registered Member
                    </span>
                  )}
                  {customer.rfmSegment === 'VIP' && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-md text-[10px] font-extrabold uppercase">
                      VIP Spender
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {customer.phone}
                  </span>
                  {customer.city && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {customer.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Contact & Close */}
            <div className="flex items-center gap-2 relative z-10">
              {onOpenQuickContact && (
                <>
                  <button
                    onClick={() => onOpenQuickContact(customer, 'WHATSAPP')}
                    className="p-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                    title="Send WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => onOpenQuickContact(customer, 'CALL')}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                    title="Call Phone"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span className="hidden sm:inline">Call</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Customer Financial KPI Strip */}
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200/80 divide-x divide-slate-200/80 p-4 text-center shrink-0">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Spent
              </span>
              <span className="text-lg font-black text-slate-900 block mt-0.5">
                ৳{customer.totalSpent.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Orders Count
              </span>
              <span className="text-lg font-black text-blue-600 block mt-0.5">
                {customer.ordersCount} Orders
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Avg Order Value
              </span>
              <span className="text-lg font-black text-slate-900 block mt-0.5">
                ৳{customer.avgOrderValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-6 pt-3 bg-white border-b border-slate-200/80 overflow-x-auto scrollbar-none shrink-0">
            {[
              { id: 'overview', label: '360° Overview' },
              { id: 'orders', label: `Orders (${customer.orders?.length || customer.ordersCount})` },
              { id: 'timeline', label: 'Activity Feed' },
              { id: 'notes', label: `Staff Notes (${notesList.length})` },
              { id: 'addresses', label: `Addresses (${customer.addresses?.length || 1})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Drawer Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB 1: 360° OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Profile Details Card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Contact & Profile
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Full Name:</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{customer.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Phone Number:</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{customer.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Email Address:</span>
                      <span className="font-bold text-slate-900 mt-0.5 block">{customer.email || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Acquisition Source:</span>
                      <span className="font-bold text-blue-600 mt-0.5 block">{customer.source}</span>
                    </div>
                  </div>
                </div>

                {/* Tags & Segments */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Customer Tags & Badges
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags && customer.tags.length > 0 ? (
                      customer.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg text-xs font-bold"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No tags assigned yet.</span>
                    )}
                  </div>
                </div>

                {/* Primary Delivery Address */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Default Delivery Address</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold">
                      Verified
                    </span>
                  </h3>
                  {customer.addresses && customer.addresses.length > 0 ? (
                    <div className="text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900">{customer.addresses[0].recipientName}</p>
                      <p>{customer.addresses[0].addressLine1}</p>
                      <p>
                        {customer.addresses[0].area}, {customer.addresses[0].district} -{' '}
                        {customer.addresses[0].division}
                      </p>
                      <p className="text-slate-500">{customer.addresses[0].phone}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Dhaka, Bangladesh</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ORDER HISTORY */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {customer.orders && customer.orders.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                      <span>Total {customer.orders.length} orders recorded</span>
                      {customer.orders.length > orderPageSize && (
                        <span>
                          Page {orderPage} of {Math.ceil(customer.orders.length / orderPageSize)}
                        </span>
                      )}
                    </div>

                    {customer.orders
                      .slice((orderPage - 1) * orderPageSize, orderPage * orderPageSize)
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-blue-600 text-sm">{ord.orderNumber}</span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md text-[10px] font-bold">
                                {ord.orderStatus}
                              </span>
                            </div>
                            <span className="font-black text-slate-900 text-sm">
                              ৳{ord.totalAmount.toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 font-medium">
                            {ord.itemsSummary || `${ord.itemCount} items in order`}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                            <span>Payment: {ord.paymentMethod} ({ord.paymentStatus})</span>
                            <span>{formatCrmDate(ord.createdAt, { showTime: true })}</span>
                          </div>
                        </div>
                      ))}

                    {customer.orders.length > orderPageSize && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                          disabled={orderPage <= 1}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all flex items-center gap-1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          Previous
                        </button>
                        <span className="text-xs font-bold text-slate-600">
                          {orderPage} / {Math.ceil(customer.orders.length / orderPageSize)}
                        </span>
                        <button
                          onClick={() => setOrderPage((p) => Math.min(Math.ceil((customer.orders?.length || 0) / orderPageSize), p + 1))}
                          disabled={orderPage >= Math.ceil(customer.orders.length / orderPageSize)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all flex items-center gap-1"
                        >
                          Next
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-bold">No orders recorded yet</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACTIVITY TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="space-y-6 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <div className="relative">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] absolute -left-6 top-0.5 shadow-xs">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block">Today, 02:30 PM</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">Steadfast Parcel Delivered</p>
                    <p className="text-xs text-slate-600 mt-1">Customer received parcel at Gulshan address without issues.</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] absolute -left-6 top-0.5 shadow-xs">
                    <PhoneCall className="w-3 h-3" />
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block">Yesterday, 11:15 AM</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">Phone Call Verification</p>
                    <p className="text-xs text-slate-600 mt-1">Confirmed delivery time before 2 PM as requested.</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] absolute -left-6 top-0.5 shadow-xs">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 block">15 Aug 2026</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">Upgraded to VIP Segment</p>
                    <p className="text-xs text-slate-600 mt-1">Total spend exceeded ৳40,000 threshold.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: INTERNAL STAFF NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-5">
                {/* Add Note Input */}
                <form onSubmit={handleAddNote} className="space-y-2.5">
                  <textarea
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write an internal note about this customer (only staff can see)..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Post Note</span>
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-3">
                  {notesList.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">{n.authorName} ({n.authorRole || 'Staff'})</span>
                        <span className="text-slate-400">{formatCrmDate(n.createdAt, { showTime: true })}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{n.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                {customer.addresses?.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold uppercase">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold text-emerald-600">Default Shipping</span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 text-xs">{addr.recipientName}</p>
                    <p className="text-xs text-slate-600">{addr.addressLine1}</p>
                    <p className="text-xs text-slate-600">
                      {addr.area}, {addr.district} - {addr.division}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">{addr.phone}</p>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400 font-medium">Customer ID: {customer.id}</span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all"
            >
              Close Profile
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
