'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  useGetCustomerByIdQuery,
  useGetCustomerAddressesQuery,
  useGetCustomerOrdersQuery,
  useGetCustomerNotesQuery,
  useCreateCustomerNoteMutation,
  useDeleteCustomerNoteMutation,
  useGetCustomerActivitiesQuery,
  useSetDefaultCustomerAddressMutation,
  useDeleteCustomerAddressMutation,
  useUpdateCustomerStatusMutation,
  CustomerAddress,
  CustomerStatusType,
} from '../api/customerApi';
import { getOriginLabel } from '../utils/origin';
import { FraudCheckPanel } from './FraudRiskBadge';
import { useLazyGetFraudCheckForCustomerQuery } from '../api/customerApi';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  FileText,
  Send,
  UserX,
  UserCheck,
  Edit2,
  Plus,
  Trash2,
  CheckCircle2,
  Star,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  MessageSquare,
  CreditCard,
  Truck,
  RotateCcw,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { AddressModal } from './AddressModal';
import { toast } from 'sonner';

interface CustomerDetailDrawerProps {
  customerId: string | null;
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

export function CustomerDetailDrawer({
  customerId,
  onClose,
  onEdit,
  onToggleStatus,
}: CustomerDetailDrawerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'notes' | 'activity' | 'fraudCheck'>('overview');

  // Address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  // Note creation state
  const [noteContent, setNoteContent] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // Block/Unblock confirmation dialog state
  const [statusConfirmAction, setStatusConfirmAction] = useState<CustomerStatusType | null>(null);

  // Orders tab pagination state
  const [ordersPage, setOrdersPage] = useState(1);

  // Queries
  const { data: customer, isLoading: isCustomerLoading, error } = useGetCustomerByIdQuery(customerId!, {
    skip: !customerId,
  });

  const {
    data: addresses = [],
    isLoading: isAddressesLoading,
    isError: isAddressesError,
  } = useGetCustomerAddressesQuery(customerId!, {
    skip: !customerId || activeTab !== 'addresses',
  });

  const {
    data: ordersResponse,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
    isError: isOrdersError,
  } = useGetCustomerOrdersQuery(
    { customerId: customerId!, page: ordersPage, limit: 10 },
    { skip: !customerId || activeTab !== 'orders' },
  );

  const {
    data: notes = [],
    isLoading: isNotesLoading,
    isError: isNotesError,
  } = useGetCustomerNotesQuery(customerId!, {
    skip: !customerId || activeTab !== 'notes',
  });

  const {
    data: activities = [],
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
  } = useGetCustomerActivitiesQuery(customerId!, {
    skip: !customerId || activeTab !== 'activity',
  });

  const customerOrders = ordersResponse?.data || [];
  const ordersMeta = ordersResponse?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const [triggerFraudCheck, { data: fraudCheckData, isFetching: isFraudCheckFetching, isError: isFraudCheckError, error: fraudCheckError }] =
    useLazyGetFraudCheckForCustomerQuery();

  React.useEffect(() => {
    if (activeTab === 'fraudCheck' && customerId && !fraudCheckData) {
      triggerFraudCheck({ customerId });
    }
  }, [activeTab, customerId]);

  // Mutations
  const [setDefaultAddress, { isLoading: isSettingDefault }] = useSetDefaultCustomerAddressMutation();
  const [deleteAddress, { isLoading: isDeletingAddress }] = useDeleteCustomerAddressMutation();
  const [createNote, { isLoading: isCreatingNote }] = useCreateCustomerNoteMutation();
  const [deleteNote, { isLoading: isDeletingNote }] = useDeleteCustomerNoteMutation();
  const [updateCustomerStatus, { isLoading: isUpdatingStatus }] = useUpdateCustomerStatusMutation();

  // Portal target isn't available during SSR/first paint.
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);

  // Close on Escape and lock background scroll while the drawer is open.
  React.useEffect(() => {
    if (!customerId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    // position:fixed (not just overflow:hidden) is needed to reliably stop
    // background scroll on mobile Safari, which otherwise still allows touch-scroll.
    const scrollY = window.scrollY;
    const body = document.body;
    const previousStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      body.style.position = previousStyles.position;
      body.style.top = previousStyles.top;
      body.style.left = previousStyles.left;
      body.style.right = previousStyles.right;
      body.style.overflow = previousStyles.overflow;
      window.scrollTo(0, scrollY);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [customerId, onClose]);

  if (!customerId || !mounted) return null;

  const initials = customer
    ? `${customer.firstName?.charAt(0) || ''}${customer.lastName?.charAt(0) || ''}`.toUpperCase()
    : 'C';

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'No orders';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleViewOrderDetails = (orderNumber: string) => {
    onClose();
    router.push(`/dashboard/orders?search=${encodeURIComponent(orderNumber)}`);
  };

  const handleStatusChangeConfirm = async (targetStatus: CustomerStatusType) => {
    try {
      await updateCustomerStatus({ id: customerId!, status: targetStatus }).unwrap();
      const statusLabel = targetStatus === 'BLOCKED' ? 'blocked' : targetStatus === 'ACTIVE' ? 'activated' : 'deactivated';
      toast.success(`Customer ${statusLabel} successfully`);
      setStatusConfirmAction(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update customer status');
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      await createNote({ customerId: customerId!, content: noteContent.trim() }).unwrap();
      toast.success('Internal note added');
      setNoteContent('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote({ customerId: customerId!, noteId }).unwrap();
      toast.success('Note deleted');
      setDeletingNoteId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete note');
    }
  };

  const handleSendEmailNotification = () => {
    if (!customer?.email) {
      toast.error('This customer does not have an email address on file.');
      return;
    }
    toast.success(`Email dispatch queued for ${customer.email}`);
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress({ customerId: customerId!, addressId }).unwrap();
      toast.success('Default address updated');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update default address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddress({ customerId: customerId!, addressId }).unwrap();
      toast.success('Address deleted successfully');
      setDeletingAddressId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete address');
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PROCESSING':
      case 'SHIPPED':
      case 'READY_TO_SHIP':
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CANCELLED':
      case 'RETURNED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'ORDER_PLACED':
        return <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />;
      case 'NOTE_ADDED':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      case 'ADDRESS_ADDED':
      case 'ADDRESS_UPDATED':
        return <MapPin className="w-3.5 h-3.5 text-emerald-600" />;
      case 'CUSTOMER_BLOCKED':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
      case 'CUSTOMER_UNBLOCKED':
      case 'CUSTOMER_ACTIVATED':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'EMAIL_SENT':
        return <Mail className="w-3.5 h-3.5 text-indigo-600" />;
      case 'SMS_SENT':
        return <MessageSquare className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <User className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-[1px] animate-backdrop-in"
      />

      {/* Drawer Panel — pinned to the viewport with inset-y-0 rather than h-full, which
          depended on an ancestor's height, and rendered through a portal so `fixed` is
          not captured by a transformed ancestor in the dashboard layout. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Customer details"
        className="fixed inset-y-0 right-0 z-[70] w-full max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-drawer-in"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-extrabold text-base text-slate-900">Customer Details</h2>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {isCustomerLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        ) : error || !customer ? (
          <div className="p-8 text-center text-rose-600 space-y-3">
            <p className="font-bold text-sm">Unable to load customer details.</p>
            <p className="text-xs text-slate-500">The customer may have been removed or access is unauthorized.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Header Profile Section */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center border border-blue-500 shadow-md shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-extrabold text-lg text-slate-900 truncate">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {customer.hasAccount ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-blue-600" />
                        Member
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                        <User className="w-3 h-3 text-amber-600" />
                        Guest
                      </span>
                    )}

                    {customer.status === 'ACTIVE' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    ) : customer.status === 'BLOCKED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Blocked
                      </span>
                    ) : customer.status === 'GUEST' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Guest
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{customer.location || 'Dhaka, Bangladesh'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Edit / Status Actions */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={onEdit}
                className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors border border-blue-100 flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </button>

              {customer.status === 'BLOCKED' ? (
                <button
                  onClick={() => setStatusConfirmAction('ACTIVE')}
                  className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl transition-colors border border-emerald-200 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Unblock Customer
                </button>
              ) : (
                <button
                  onClick={() => setStatusConfirmAction('BLOCKED')}
                  className="flex-1 py-2 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl transition-colors border border-rose-200 flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Block Customer
                </button>
              )}
            </div>

            {/* Inline Status Action Confirmation */}
            {statusConfirmAction && (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2">
                <p className="font-extrabold text-amber-900">
                  {statusConfirmAction === 'BLOCKED'
                    ? `Block ${customer.firstName} ${customer.lastName}?`
                    : `Unblock ${customer.firstName} ${customer.lastName}?`}
                </p>
                <p className="text-amber-800 text-[11px]">
                  {statusConfirmAction === 'BLOCKED'
                    ? 'Blocking will restrict account access. Existing orders and historical data remain intact.'
                    : 'Unblocking will restore normal account access.'}
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setStatusConfirmAction(null)}
                    className="px-3 py-1 bg-white text-slate-700 font-bold text-[11px] rounded-xl border border-slate-200 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusChangeConfirm(statusConfirmAction)}
                    disabled={isUpdatingStatus}
                    className={`px-3 py-1 text-white font-bold text-[11px] rounded-xl transition-colors ${
                      statusConfirmAction === 'BLOCKED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isUpdatingStatus ? 'Updating...' : statusConfirmAction === 'BLOCKED' ? 'Confirm Block' : 'Confirm Unblock'}
                  </button>
                </div>
              </div>
            )}

            {/* 2. Customer Summary Metrics Row */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 text-center">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Orders</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">{customer.stats.totalOrders}</p>
              </div>
              <div className="border-x border-slate-200/80">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Spent</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">৳{customer.stats.totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg. Order</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">৳{customer.stats.avgOrderValue.toLocaleString()}</p>
              </div>
            </div>

            {/* 3. Drawer Navigation Tabs */}
            <div className="border-b border-slate-200 flex space-x-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Overview
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-1 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>Orders</span>
                {customer.stats.totalOrders > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100">
                    {customer.stats.totalOrders}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`py-2 px-1 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'addresses'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>Addresses</span>
                {addresses.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100">
                    {addresses.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`py-2 px-1 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'notes'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>Notes</span>
                {notes.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100">
                    {notes.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`py-2 px-1 border-b-2 text-xs font-bold transition-all ${
                  activeTab === 'activity'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Activity
              </button>

              <button
                onClick={() => setActiveTab('fraudCheck')}
                className={`py-2 px-1 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'fraudCheck'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Fraud Check
              </button>
            </div>

            {/* 4. Tab Panels */}

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Customer Information Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                    Customer Information
                  </h4>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Full Name</p>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {customer.firstName} {customer.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Email Address</p>
                      <p className="font-bold text-slate-900 mt-0.5 truncate">
                        {customer.email || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Phone</p>
                      <p className="font-bold text-slate-900 mt-0.5">{customer.phone}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Date Joined</p>
                      <p className="font-bold text-slate-900 mt-0.5">{formatDate(customer.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Marketing Origin</p>
                      <p className="font-bold text-blue-700 mt-0.5">{getOriginLabel(customer) ?? 'Direct / Organic'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Account Type</p>
                      <p className="font-bold mt-0.5">
                        {customer.hasAccount ? (
                          <span className="text-blue-700 font-bold">Registered Member</span>
                        ) : (
                          <span className="text-amber-700 font-bold">Guest (No Login Account)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {(customer.registrationUtmSource || customer.registrationUtmMedium || customer.registrationUtmCampaign || customer.registrationReferrerHost) && (
                    <div className="grid grid-cols-2 gap-4 text-xs mt-4 pt-4 border-t border-slate-100">
                      {customer.registrationUtmSource && (
                        <div>
                          <p className="text-slate-400 font-medium">UTM Source</p>
                          <p className="font-bold text-slate-900 mt-0.5">{customer.registrationUtmSource}</p>
                        </div>
                      )}
                      {customer.registrationUtmMedium && (
                        <div>
                          <p className="text-slate-400 font-medium">UTM Medium</p>
                          <p className="font-bold text-slate-900 mt-0.5">{customer.registrationUtmMedium}</p>
                        </div>
                      )}
                      {customer.registrationUtmCampaign && (
                        <div>
                          <p className="text-slate-400 font-medium">UTM Campaign</p>
                          <p className="font-bold text-slate-900 mt-0.5">{customer.registrationUtmCampaign}</p>
                        </div>
                      )}
                      {customer.registrationReferrerHost && (
                        <div>
                          <p className="text-slate-400 font-medium">Referrer</p>
                          <p className="font-bold text-slate-900 mt-0.5 truncate">{customer.registrationReferrerHost}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Statistics Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                    Statistics
                  </h4>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Total Orders</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">{customer.stats.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Completed Orders</p>
                      <p className="font-extrabold text-emerald-700 mt-0.5">{customer.stats.completedOrders}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Cancelled Orders</p>
                      <p className="font-extrabold text-rose-600 mt-0.5">{customer.stats.cancelledOrders}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Total Spent</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">৳{customer.stats.totalSpent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Average Order Value</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">৳{customer.stats.avgOrderValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Last Order Date</p>
                      <p className="font-extrabold text-slate-900 mt-0.5">{formatDate(customer.stats.lastOrderAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                    Quick Actions
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="py-2.5 px-3 bg-white border border-slate-200 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Orders
                    </button>

                    <button
                      onClick={() => setActiveTab('notes')}
                      className="py-2.5 px-3 bg-white border border-slate-200 text-amber-600 font-bold rounded-xl hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Add Note
                    </button>

                    <button
                      onClick={handleSendEmailNotification}
                      className="py-2.5 px-3 bg-white border border-slate-200 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Email
                    </button>

                    {customer.status === 'BLOCKED' ? (
                      <button
                        onClick={() => setStatusConfirmAction('ACTIVE')}
                        className="py-2.5 px-3 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Unblock Customer
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatusConfirmAction('BLOCKED')}
                        className="py-2.5 px-3 bg-white border border-rose-200 text-rose-700 font-bold rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        Block Customer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab Content (CHUNK 5) */}
            {activeTab === 'orders' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-900">Order History</h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Total: {ordersMeta.total} orders
                  </span>
                </div>

                {isOrdersLoading || isOrdersFetching ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                  </div>
                ) : isOrdersError ? (
                  <div className="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
                    <p className="font-bold">Unable to load order history.</p>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
                    <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-slate-900">No Orders Yet</h5>
                    <p className="text-slate-500 text-[11px] max-w-xs mx-auto">
                      This customer has not placed any orders with your store yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-blue-300 transition-all space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-xs hover:text-blue-600 cursor-pointer" onClick={() => handleViewOrderDetails(order.orderNumber)}>
                              {order.orderNumber}
                            </span>
                            <span className="text-slate-400 text-[11px]">•</span>
                            <span className="text-slate-500 font-semibold text-[11px]">
                              {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
                            </span>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getOrderStatusBadge(order.orderStatus)}`}>
                            {order.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="font-black text-slate-900 text-sm block">
                              ৳{order.grandTotal.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {formatDateTime(order.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-lg text-[10px]">
                              {order.paymentMethod} • {order.paymentStatus}
                            </span>

                            <button
                              onClick={() => handleViewOrderDetails(order.orderNumber)}
                              className="p-1.5 bg-slate-50 text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors"
                              title="View Order Details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {order.courierProvider && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">{order.courierProvider}</span>
                            {order.trackingCode && <span className="text-slate-400">• {order.trackingCode}</span>}
                            {order.consignmentStatus && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase">
                                {order.consignmentStatus.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {ordersMeta.totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 text-xs font-semibold text-slate-500">
                        <span>
                          Page {ordersMeta.page} of {ordersMeta.totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                            disabled={ordersMeta.page <= 1}
                            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setOrdersPage((p) => Math.min(ordersMeta.totalPages, p + 1))}
                            disabled={ordersMeta.page >= ordersMeta.totalPages}
                            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab Content (CHUNK 4) */}
            {activeTab === 'addresses' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-900">Delivery Addresses</h4>
                  <button
                    onClick={() => {
                      setEditingAddress(null);
                      setIsAddressModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Address
                  </button>
                </div>

                {isAddressesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-28 w-full rounded-2xl" />
                    <Skeleton className="h-28 w-full rounded-2xl" />
                  </div>
                ) : isAddressesError ? (
                  <div className="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
                    <p className="font-bold">Failed to load addresses.</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
                    <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-slate-900">No Addresses Found</h5>
                    <p className="text-slate-500 text-[11px] max-w-xs mx-auto">
                      No delivery addresses have been saved for this customer yet. Add an address to make checkout easier.
                    </p>
                    <button
                      onClick={() => {
                        setEditingAddress(null);
                        setIsAddressModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl border border-blue-100 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Delivery Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`bg-white rounded-2xl p-4 border transition-all space-y-2.5 ${
                          addr.isDefault
                            ? 'border-blue-300 ring-2 ring-blue-500/10 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                                Default
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingAddress(addr);
                                setIsAddressModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit address"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingAddressId(addr.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-slate-900 text-xs">{addr.recipientName}</p>
                          <p className="text-slate-500 font-medium text-[11px]">{addr.phone}</p>
                        </div>

                        <p className="text-slate-700 text-xs leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                          {addr.area ? `, ${addr.area}` : ''}
                          {`, ${addr.city}`}
                          {addr.postalCode ? ` - ${addr.postalCode}` : ''}
                          {`, ${addr.country}`}
                        </p>

                        {!addr.isDefault && (
                          <div className="pt-1 border-t border-slate-100">
                            <button
                              onClick={() => handleSetDefault(addr.id)}
                              disabled={isSettingDefault}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
                            >
                              Set as Default Address
                            </button>
                          </div>
                        )}

                        {deletingAddressId === addr.id && (
                          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between gap-2 mt-2">
                            <span className="text-[11px] font-bold text-rose-800">Confirm delete address?</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setDeletingAddressId(null)}
                                className="px-2.5 py-1 bg-white text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                disabled={isDeletingAddress}
                                className="px-2.5 py-1 bg-rose-600 text-white font-bold text-[11px] rounded-lg hover:bg-rose-700"
                              >
                                {isDeletingAddress ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab Content (CHUNK 6) */}
            {activeTab === 'notes' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-900">Internal Merchant Notes</h4>
                  <span className="text-[11px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    Team Private
                  </span>
                </div>

                <form onSubmit={handleAddNoteSubmit} className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
                  <textarea
                    rows={3}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Add an internal note about this customer..."
                    required
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">Notes are visible only to store staff</span>
                    <button
                      type="submit"
                      disabled={isCreatingNote || !noteContent.trim()}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isCreatingNote ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Note'
                      )}
                    </button>
                  </div>
                </form>

                {isNotesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                  </div>
                ) : isNotesError ? (
                  <div className="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
                    <p className="font-bold">Failed to load internal notes.</p>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
                    <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-slate-900">No Internal Notes Yet</h5>
                    <p className="text-slate-500 text-[11px] max-w-xs mx-auto">
                      Add a note above to keep important customer preferences or notes for your team.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((n) => (
                      <div key={n.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{n.authorName}</span>
                            <span className="text-[11px] text-slate-400">•</span>
                            <span className="text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                          </div>

                          <button
                            onClick={() => setDeletingNoteId(n.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{n.content}</p>

                        {deletingNoteId === n.id && (
                          <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between gap-2 mt-2">
                            <span className="text-[11px] font-bold text-rose-800">Delete this note?</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setDeletingNoteId(null)}
                                className="px-2 py-0.5 bg-white text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteNote(n.id)}
                                disabled={isDeletingNote}
                                className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[11px] rounded-lg hover:bg-rose-700"
                              >
                                {isDeletingNote ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab Content (CHUNK 6) */}
            {activeTab === 'activity' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-900">Activity Timeline</h4>
                  <span className="text-[11px] text-slate-400 font-medium">Newest first</span>
                </div>

                {isActivitiesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </div>
                ) : isActivitiesError ? (
                  <div className="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
                    <p className="font-bold">Failed to load activity timeline.</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
                    <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-slate-900">No Activity Yet</h5>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {activities.map((act) => (
                      <div key={act.id} className="relative group">
                        <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-300 shadow-2xs flex items-center justify-center -translate-x-1/2">
                          {getActivityIcon(act.eventType)}
                        </div>

                        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-900 text-xs">{act.title}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {act.actorName}
                            </span>
                          </div>

                          {act.description && (
                            <p className="text-slate-600 text-[11px] leading-relaxed">{act.description}</p>
                          )}

                          <span className="text-[10px] text-slate-400 block pt-0.5">
                            {formatDateTime(act.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fraud Check Tab Content */}
            {activeTab === 'fraudCheck' && (
              <div className="text-xs">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-extrabold text-xs text-slate-900">Courier Fraud Check</h4>
                  <span className="text-[11px] text-slate-400 font-medium">via FraudBD</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  Cross-courier delivery and cancellation history for this customer's phone number.
                </p>
                <FraudCheckPanel
                  data={fraudCheckData}
                  isFetching={isFraudCheckFetching}
                  isError={isFraudCheckError}
                  errorMessage={(fraudCheckError as any)?.data?.message}
                  onRefresh={() => customerId && triggerFraudCheck({ customerId, refresh: true })}
                />
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Address Form Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        customerId={customerId!}
        address={editingAddress}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
      />
    </>,
    document.body,
  );
}
