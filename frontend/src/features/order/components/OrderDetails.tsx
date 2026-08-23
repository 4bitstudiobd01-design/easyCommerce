'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  CreditCard, 
  Clock, 
  User, 
  FileText,
  AlertCircle,
  Truck,
  CheckCircle2,
  X,
  ChevronDown,
  Loader2,
  DollarSign
} from 'lucide-react';
import { useGetOrderByIdQuery, useUpdateOrderStatusMutation, useCollectCodPaymentMutation, useUndoCollectCodPaymentMutation, OrderStatusType, useGetReturnsByOrderQuery, useGetRefundsByOrderQuery, useProcessRefundMutation, useUpdateReturnStatusMutation } from '../api/orderApi';
import { useSyncConsignmentMutation } from '../../logistics/api/logisticsApi';
import { useGetOrderBalanceQuery, useGetOrderPaymentHistoryQuery } from '../../payment/api/paymentApi';
import { SendCourierModal } from './SendCourierModal';
import { CreateReturnModal } from './CreateReturnModal';
import { RefundModal } from './RefundModal';
import { RecordManualPaymentModal } from './RecordManualPaymentModal';
import { SendPaymentLinkModal } from './SendPaymentLinkModal';
import { StatusChangeConfirmModal } from './StatusChangeConfirmModal';
import { OrderActivityFeed } from './OrderActivityFeed';
import { RefreshCw, IndianRupee, Phone, Copy, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

interface OrderDetailsProps {
  orderId: string;
}

export function OrderDetails({ orderId }: OrderDetailsProps) {
  const router = useRouter();
  const { data: order, isLoading, error } = useGetOrderByIdQuery(orderId);

  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [syncConsignment, { isLoading: isSyncing }] = useSyncConsignmentMutation();
  const [collectCodPayment, { isLoading: isCollectingCod }] = useCollectCodPaymentMutation();
  const [undoCollectCodPayment, { isLoading: isUndoingCod }] = useUndoCollectCodPaymentMutation();
  const { data: returns } = useGetReturnsByOrderQuery(orderId, { skip: !orderId });
  const { data: refunds } = useGetRefundsByOrderQuery(orderId, { skip: !orderId });
  const [processRefund, { isLoading: isProcessingRefund }] = useProcessRefundMutation();
  const [updateReturnStatus, { isLoading: isUpdatingReturn }] = useUpdateReturnStatusMutation();
  const { data: balance } = useGetOrderBalanceQuery(orderId, { skip: !orderId });
  const { data: paymentHistory } = useGetOrderPaymentHistoryQuery(orderId, { skip: !orderId });

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; targetStatus?: OrderStatusType }>({ isOpen: false });
  const [codModal, setCodModal] = useState(false);
  const [undoCodModal, setUndoCodModal] = useState(false);
  const [undoCodReason, setUndoCodReason] = useState('');
  const [returnModal, setReturnModal] = useState(false);
  const [refundModal, setRefundModal] = useState(false);
  const [courierModalOpen, setCourierModalOpen] = useState(false);
  const [manualPaymentModal, setManualPaymentModal] = useState(false);
  const [paymentLinkModal, setPaymentLinkModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateStatus = async (status: OrderStatusType, reason?: string) => {
    try {
      await updateStatus({ id: orderId, orderStatus: status, reason }).unwrap();
      setConfirmModal({ isOpen: false });
    } catch (err: any) {
      console.error('Failed to update status', err);
      alert(err?.data?.message || 'Failed to update order status');
    }
  };

  const handleSyncConsignment = async () => {
    if (!order?.id) return;
    try {
      await syncConsignment(order.id).unwrap();
    } catch (err: any) {
      console.error('Failed to sync consignment', err);
      alert(err?.data?.message || 'Failed to refresh tracking status');
    }
  };

  const handleCollectCod = async () => {
    if (!order?.id) return;
    try {
      await collectCodPayment(order.id).unwrap();
      setCodModal(false);
    } catch (err: any) {
      console.error('Failed to collect COD', err);
      alert(err?.data?.message || 'Failed to collect COD');
    }
  };

  const handleUndoCollectCod = async () => {
    if (!order?.id || !undoCodReason.trim()) return;
    try {
      await undoCollectCodPayment({ id: order.id, reason: undoCodReason.trim() }).unwrap();
      setUndoCodModal(false);
      setUndoCodReason('');
    } catch (err: any) {
      console.error('Failed to undo COD collection', err);
      alert(err?.data?.message || 'Failed to undo COD collection');
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          The order you are looking for does not exist or you do not have permission to view it.
        </p>
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
      case 'RETURNED': return 'bg-red-50 text-red-700 border-red-200';
      case 'PROCESSING': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'READY_TO_SHIP':
      case 'SHIPPED': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Order #{order.orderNumber}
            </h2>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(order.orderStatus)}`}>
              {order.orderStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {formattedDate} &middot; {formattedTime}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {['PENDING', 'ON_HOLD', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus) && (
            <Link
              href={`/dashboard/orders/${order.id}/edit`}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors"
            >
              Edit Order
            </Link>
          )}

          {order.orderStatus === 'PENDING' && (
            <button 
              onClick={() => setConfirmModal({ isOpen: true, targetStatus: 'CONFIRMED' })}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
            >
              Confirm Order
            </button>
          )}
          {order.orderStatus === 'CONFIRMED' && (
            <button 
              onClick={() => setConfirmModal({ isOpen: true, targetStatus: 'PROCESSING' })}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              Start Processing
            </button>
          )}
          {order.orderStatus === 'PROCESSING' && (
            <button 
              onClick={() => setConfirmModal({ isOpen: true, targetStatus: 'READY_TO_SHIP' })}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Mark Ready to Ship
            </button>
          )}
          
          {balance && balance.balanceDue > 0 && order.paymentMethod !== 'COD' && (
            <button
              onClick={() => setPaymentLinkModal(true)}
              className="px-4 py-2 bg-white text-slate-700 text-sm font-bold rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Send Payment Link
            </button>
          )}

          {['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'ON_HOLD'].includes(order.orderStatus) && (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="px-3 py-2 bg-white text-slate-700 text-sm font-bold rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                More <ChevronDown className="w-4 h-4" />
              </button>
              
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-20">
                                    <button
                    onClick={() => { setShowMoreMenu(false); setReturnModal(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    Create Return
                  </button>
                  <button
                    onClick={() => { setShowMoreMenu(false); setRefundModal(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    Issue Refund
                  </button>
                  <button
                    onClick={() => { setShowMoreMenu(false); setConfirmModal({ isOpen: true, targetStatus: 'CANCELLED' }); }}
                    className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Status Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Payment Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
            <CreditCard className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment</p>
            <p className="text-sm font-bold text-slate-900 mb-0.5">
              {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
            </p>
            <p className={`text-xs font-bold inline-flex items-center ${order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {order.paymentStatus === 'UNPAID' && order.paymentMethod === 'COD' ? 'COD Pending' : order.paymentStatus}
            </p>
          </div>
        </div>

        {/* Fulfillment Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
            <Truck className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fulfillment</p>
            {order.consignment ? (
              <>
                <p className="text-sm font-bold text-slate-900 mb-0.5">{order.consignment.courierProvider}</p>
                <p className="text-xs font-bold text-blue-600 mb-2">{order.consignment.status.replace(/_/g, ' ')}</p>
                <div className="bg-slate-50 border border-slate-100 rounded p-2 mt-1 mb-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Tracking Code</p>
                  <p className="text-xs font-medium text-slate-700">
                    {order.consignment.trackingCode || 'Not Assigned'}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded p-2 mt-1 mb-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Courier Bill (Merchant only)</p>
                  <p className="text-xs font-medium text-slate-700">
                    Quoted ৳{Number(order.deliveryFee).toLocaleString()} · Courier charged ৳{Number(order.consignment.deliveryCharge).toLocaleString()}
                    {' · '}
                    <span className={Number(order.consignment.deliveryCharge) > Number(order.deliveryFee) ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                      {Number(order.consignment.deliveryCharge) > Number(order.deliveryFee) ? '-' : '+'}৳{Math.abs(Number(order.consignment.deliveryCharge) - Number(order.deliveryFee)).toLocaleString()} margin
                    </span>
                  </p>
                </div>
                {order.consignment.lastSyncAt && (
                  <p className="text-[10px] text-slate-500 mb-2">
                    Last updated: {new Date(order.consignment.lastSyncAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
                  </p>
                )}
                <button 
                  onClick={handleSyncConsignment}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-xs font-bold rounded-lg border border-slate-200 w-full flex items-center justify-center gap-2"
                >
                  {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck className="w-3 h-3" />}
                  Refresh Status
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-900 mb-0.5">Not Booked</p>
                <p className="text-xs font-medium text-slate-500 mb-3">Awaiting courier dispatch</p>
                {order.orderStatus === 'READY_TO_SHIP' && (
                  <button 
                    onClick={() => setCourierModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-bold rounded-lg border border-blue-200 w-full"
                  >
                    Book Courier
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Totals Quick Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Grand Total</p>
            <p className="text-2xl font-black text-slate-900">৳{Number(order.grandTotal).toLocaleString()}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {order.items?.length || 0} item{order.items?.length !== 1 && 's'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Column (65%) */}
        <div className="flex-1 space-y-6">
          
          {/* Shipment Tracking Timeline (if consignment exists) */}
          {order.consignment && order.consignment.events && order.consignment.events.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400" />
                Shipment Tracking
              </h3>
              
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-2.5 before:w-px before:bg-slate-100">
                {order.consignment.events.map((event: any, index: number) => {
                  const isLatest = index === 0;
                  return (
                    <div key={index} className="relative">
                      <div className={`absolute -left-[30px] w-3 h-3 rounded-full border-2 ${
                        isLatest ? 'bg-blue-600 border-blue-100 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]' : 'bg-slate-300 border-white'
                      }`} />
                      
                      <div>
                        <p className={`text-sm font-bold ${isLatest ? 'text-slate-900' : 'text-slate-600'}`}>
                          {event.status.replace(/_/g, ' ')}
                        </p>
                        
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                          {new Date(event.eventTimestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + new Date(event.eventTimestamp).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
                          {event.location && ` · ${event.location}`}
                        </p>
                        
                        {event.description && (
                          <p className={`text-sm mt-1.5 ${isLatest ? 'text-slate-700' : 'text-slate-500'}`}>
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" /> Order Items
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                {order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0} items
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3 text-right w-20">Price</th>
                    <th className="px-5 py-3 text-center w-20">Qty</th>
                    <th className="px-5 py-3 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                  {order.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.productImageUrl ? (
                            <img src={item.productImageUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-slate-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{item.productTitle}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                              {item.isCustomItem && (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                                  <Tag className="w-2.5 h-2.5" /> Custom
                                </span>
                              )}
                              {item.sku && `SKU: ${item.sku}`}
                              {Number(item.discountAmount) > 0 && (
                                <span className="text-emerald-600">-৳{Number(item.discountAmount).toLocaleString()} discount</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">৳{Number(item.unitPrice).toLocaleString()}</td>
                      <td className="px-5 py-4 text-center">x{item.quantity}</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900">
                        ৳{Number(item.totalPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Payment Summary */}
            <div className="bg-slate-50 border-t border-slate-200 p-5 space-y-3">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Subtotal</span>
                <span>৳{Number(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Delivery Charge</span>
                <span>৳{Number(order.deliveryFee).toLocaleString()}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-xs font-medium text-emerald-600">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span>-৳{Number(order.discountAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">Total</span>
                <span className="text-lg font-black text-slate-900">৳{Number(order.grandTotal).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Timeline & Notes Activity Feed */}
          <OrderActivityFeed orderId={order.id} />
          
        </div>

        {/* Sidebar (35%) */}
        <div className="w-full lg:w-80 space-y-6">

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">Payment</h3>
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Method</p>
                </div>
                <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                  order.paymentStatus === 'PAID' || order.paymentStatus === 'COD_COLLECTED'
                    ? 'bg-emerald-50 text-emerald-700'
                    : order.paymentStatus === 'PARTIALLY_PAID'
                    ? 'bg-blue-50 text-blue-700'
                    : order.paymentStatus === 'FAILED'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {order.paymentStatus === 'PARTIALLY_PAID' ? 'PARTIALLY PAID' : order.paymentStatus.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Order Total</span>
                  <span className="font-bold text-slate-900">৳{order.grandTotal}</span>
                </div>
                {balance && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">Amount Paid</span>
                      <span className="font-bold text-emerald-600">৳{balance.amountPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100">
                      <span className="font-medium text-slate-500">Balance Due</span>
                      <span className={`font-bold ${balance.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ৳{balance.balanceDue.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                {order.paymentMethod === 'COD' && (
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Collection</span>
                    <span className={`font-bold ${order.paymentStatus === 'COD_COLLECTED' ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {order.paymentStatus === 'COD_COLLECTED' ? 'Collected' : 'Pending'}
                    </span>
                  </div>
                )}
                {order.paymentMethod !== 'COD' && order.paymentStatus === 'PAID' && (
                  <div className="flex justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="font-medium text-slate-500">Transaction</span>
                    <span className="font-bold text-slate-700 text-[10px]">VERIFIED</span>
                  </div>
                )}
              </div>

              {paymentHistory && paymentHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Payment History</p>
                  {paymentHistory.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-700">{p.paymentMethod.replace(/_/g, ' ')}</span>
                        <span className="text-slate-400 ml-1.5">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="font-bold text-slate-900">৳{Number(p.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {order.paymentMethod === 'COD' && order.paymentStatus === 'COD_PENDING' && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setCodModal(true)}
                    className="w-full py-2 bg-slate-900 text-white hover:bg-slate-800 transition-colors text-xs font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Mark Collected
                  </button>
                </div>
              )}

              {order.paymentMethod === 'COD' && order.paymentStatus === 'COD_COLLECTED' && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setUndoCodModal(true)}
                    className="w-full py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors text-xs font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Undo Collection
                  </button>
                </div>
              )}

              {balance && balance.balanceDue > 0 && order.paymentMethod !== 'COD' && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setManualPaymentModal(true)}
                    className="w-full py-2 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors text-xs font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Record Manual Payment
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Customer */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <User className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">Customer</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center border border-blue-100 text-sm">
                  {order.customerName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-500">Phone</span>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${order.customerPhone}`} className="font-bold text-blue-600 hover:underline">{order.customerPhone}</a>
                    <a
                      href={`tel:${order.customerPhone}`}
                      title="Call customer"
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      title="Copy order number and phone"
                      onClick={() => {
                        navigator.clipboard.writeText(`Order #${order.orderNumber}\nPhone: ${order.customerPhone}`);
                        toast.success('Copied to clipboard.');
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {order.customerEmail && (
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Email</span>
                    <a href={`mailto:${order.customerEmail}`} className="font-bold text-slate-900 truncate max-w-[150px]">{order.customerEmail}</a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">Shipping Address</h3>
              </div>
              <button
                type="button"
                title="Copy customer details"
                onClick={() => {
                  const addressLines = [
                    order.shippingAddress,
                    order.area,
                    [order.thana, order.district].filter(Boolean).join(', '),
                    `${order.city}${order.division ? `, ${order.division}` : ''}`,
                  ].filter(Boolean);
                  navigator.clipboard.writeText(
                    [
                      `Order #${order.orderNumber}`,
                      order.customerName,
                      order.customerPhone,
                      ...addressLines,
                    ].join('\n'),
                  );
                  toast.success('Customer details copied to clipboard.');
                }}
                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5 text-sm">
              <p className="font-bold text-slate-900">{order.customerName}</p>
              <p className="text-xs text-slate-500 mb-3">{order.customerPhone}</p>
              
              <div className="text-slate-700 space-y-1 text-xs font-medium leading-relaxed">
                <p>{order.shippingAddress}</p>
                {order.area && <p>{order.area}</p>}
                {(order.thana || order.district) && (
                  <p>{[order.thana, order.district].filter(Boolean).join(', ')}</p>
                )}
                <p>{order.city}{order.division ? `, ${order.division}` : ''}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(order.customerNote || order.internalNote) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900">Order Notes</h3>
              </div>
              <div className="p-5 space-y-4">
                {order.customerNote && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Customer Note</p>
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {order.customerNote}
                    </p>
                  </div>
                )}
                {order.internalNote && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      Internal Note <AlertCircle className="w-3 h-3" />
                    </p>
                    <p className="text-xs text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-100 leading-relaxed">
                      {order.internalNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="px-2 text-xs text-slate-400 space-y-1.5 text-center font-medium">
            <p>ID: {order.id}</p>
            <p>Source: {order.storeSlug || 'Online Store'}</p>
          </div>

        </div>
      </div>

      {/* Modals */}
      <StatusChangeConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        order={order}
        targetStatus={confirmModal.targetStatus ?? null}
        currentStatus={order.orderStatus}
        isSubmitting={isUpdating}
        onConfirm={(status, reason) => handleUpdateStatus(status, reason)}
      />

      {/* Collect COD Modal */}
      {codModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold">Mark COD as Collected</h3>
              <p className="text-sm text-slate-500 mt-2">
                Order <span className="font-bold text-slate-900">{order.orderNumber}</span>
              </p>
              
              <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">COD Amount</p>
                <p className="text-2xl font-black text-amber-900 mt-1">৳{order.grandTotal}</p>
              </div>

              <p className="text-sm text-slate-600 font-medium mt-6">
                Confirm that this amount has been collected from the customer or courier. This action is recorded in the audit log.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setCodModal(false)}
                disabled={isCollectingCod}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCollectCod}
                disabled={isCollectingCod}
                className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm flex items-center gap-2"
              >
                {isCollectingCod && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo COD Collection Modal */}
      {undoCodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold">Undo COD Collection</h3>
              <p className="text-sm text-slate-500 mt-2">
                Order <span className="font-bold text-slate-900">{order.orderNumber}</span>
              </p>

              <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Amount</p>
                <p className="text-2xl font-black text-red-900 mt-1">৳{order.grandTotal}</p>
              </div>

              <p className="text-sm text-slate-600 font-medium mt-6">
                This reverts the payment status back to pending and voids the collection record. This action is recorded in the audit log.
              </p>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Reason (required)
                </label>
                <textarea
                  value={undoCodReason}
                  onChange={(e) => setUndoCodReason(e.target.value)}
                  placeholder="e.g. Marked as collected by mistake"
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white min-h-[70px]"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setUndoCodModal(false);
                  setUndoCodReason('');
                }}
                disabled={isUndoingCod}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUndoCollectCod}
                disabled={isUndoingCod || !undoCodReason.trim()}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-2"
              >
                {isUndoingCod && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Undo
              </button>
            </div>
          </div>
        </div>
      )}

      {courierModalOpen && order && (
        <SendCourierModal order={order} onClose={() => setCourierModalOpen(false)} />
      )}

      {order && (
        <RecordManualPaymentModal
          isOpen={manualPaymentModal}
          onClose={() => setManualPaymentModal(false)}
          orderId={order.id}
          orderNumber={order.orderNumber}
        />
      )}

      {order && (
        <SendPaymentLinkModal
          isOpen={paymentLinkModal}
          onClose={() => setPaymentLinkModal(false)}
          orderId={order.id}
          orderNumber={order.orderNumber}
        />
      )}
    </div>
  );
}
