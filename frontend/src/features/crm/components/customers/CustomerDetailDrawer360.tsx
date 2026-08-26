'use client';

import React, { useState } from 'react';
import { Customer360, CustomerNote, CustomerAddress } from '../../types/crm.types';
import {
  X,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Clock,
  Sparkles,
  MessageCircle,
  PhoneCall,
  Plus,
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
  Edit2,
  Globe,
} from 'lucide-react';
import { formatCrmDate } from '../../utils/formatDate';
import { getOriginLabel } from '@/features/customer/utils/origin';
import { FraudRiskBadge } from '@/features/customer/components/FraudRiskBadge';
import { toast } from 'sonner';

interface CustomerDetailDrawer360Props {
  customer: Customer360 | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickContact?: (customer: Customer360, channel: 'WHATSAPP' | 'CALL' | 'SMS') => void;
  onOpenEdit?: (customer: Customer360) => void;
  onOpenAddAddress?: (customer: Customer360) => void;
}

export const CustomerDetailDrawer360: React.FC<CustomerDetailDrawer360Props> = ({
  customer,
  isOpen,
  onClose,
  onOpenQuickContact,
  onOpenEdit,
  onOpenAddAddress,
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

  const originLabel = getOriginLabel(customer);

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
                <div className="flex items-center gap-2 flex-wrap">
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
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
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

                {/* Fraud Risk Courier Verification Badge */}
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <FraudRiskBadge
                    customerId={customer.id}
                    customerLabel={`${customer.fullName} · ${customer.phone}`}
                  />
                </div>
              </div>
            </div>

            {/* Actions & Close */}
            <div className="flex items-center gap-2 relative z-10">
              {onOpenEdit && (
                <button
                  onClick={() => onOpenEdit(customer)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs border border-slate-700"
                  title="Edit Customer Details"
                >
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}
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
                ৳{(customer.totalSpent || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Orders Count
              </span>
              <span className="text-lg font-black text-blue-600 block mt-0.5">
                {customer.ordersCount || 0} Orders
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Avg Order Value
              </span>
              <span className="text-lg font-black text-slate-900 block mt-0.5">
                ৳{(customer.avgOrderValue || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-6 pt-3 bg-white border-b border-slate-200/80 overflow-x-auto scrollbar-none shrink-0">
            {[
              { id: 'overview', label: '360° Overview' },
              { id: 'orders', label: `Orders (${customer.orders?.length || customer.ordersCount || 0})` },
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Contact & Profile
                    </h3>
                    {onOpenEdit && (
                      <button
                        onClick={() => onOpenEdit(customer)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Info</span>
                      </button>
                    )}
                  </div>
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
                    {originLabel && (
                      <div>
                        <span className="text-slate-400 block">Marketing Origin:</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                          {originLabel}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 block">Registered On:</span>
                      <span className="font-medium text-slate-700 mt-0.5 block">
                        {formatCrmDate(customer.createdAt, { showTime: true })}
                      </span>
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Default Delivery Address
                    </h3>
                    {onOpenAddAddress && (
                      <button
                        onClick={() => onOpenAddAddress(customer)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Manage Address</span>
                      </button>
                    )}
                  </div>
                  {customer.addresses && customer.addresses.length > 0 ? (
                    <div className="text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900">{customer.addresses[0].recipientName}</p>
                      <p>{customer.addresses[0].addressLine1}</p>
                      <p>
                        {customer.addresses[0].area ? `${customer.addresses[0].area}, ` : ''}
                        {customer.addresses[0].district} - {customer.addresses[0].division}
                      </p>
                      <p className="text-slate-500">{customer.addresses[0].phone}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No addresses saved yet.</p>
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

                          {ord.itemsSummary && (
                            <p className="text-xs text-slate-600 font-medium">{ord.itemsSummary}</p>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                            <span>{formatCrmDate(ord.createdAt, { showTime: true })}</span>
                            <span className="font-semibold text-slate-600">{ord.paymentMethod}</span>
                          </div>
                        </div>
                      ))}

                    {/* Pagination buttons */}
                    {customer.orders.length > orderPageSize && (
                      <div className="flex items-center justify-between pt-2">
                        <button
                          disabled={orderPage <= 1}
                          onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 bg-slate-100 disabled:opacity-40 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition"
                        >
                          Previous
                        </button>
                        <button
                          disabled={orderPage >= Math.ceil(customer.orders.length / orderPageSize)}
                          onClick={() => setOrderPage((p) => p + 1)}
                          className="px-3 py-1.5 bg-slate-100 disabled:opacity-40 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200/80">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No Orders Placed Yet</p>
                    <p className="text-xs text-slate-400 mt-1">This customer has not completed any checkouts.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {formatCrmDate(customer.createdAt, { showTime: true })}
                      </span>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">Account Created</p>
                      <p className="text-xs text-slate-500">Customer registered via {customer.source}.</p>
                    </div>
                  </div>
                  {customer.lastOrderAt && (
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-xs" />
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block">
                          {formatCrmDate(customer.lastOrderAt, { showTime: true })}
                        </span>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">Recent Purchase Completed</p>
                        <p className="text-xs text-slate-500">Completed checkout successfully.</p>
                      </div>
                    </div>
                  )}
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Customer Addresses ({customer.addresses?.length || 0})
                  </span>
                  {onOpenAddAddress && (
                    <button
                      onClick={() => onOpenAddAddress(customer)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Address</span>
                    </button>
                  )}
                </div>
                {customer.addresses && customer.addresses.length > 0 ? (
                  customer.addresses.map((addr) => (
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
                        {addr.area ? `${addr.area}, ` : ''}
                        {addr.district} - {addr.division}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">{addr.phone}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80">
                    <MapPin className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No Addresses Saved</p>
                    <p className="text-xs text-slate-400 mt-0.5">Click &quot;Add Address&quot; above to store shipping info.</p>
                  </div>
                )}
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
