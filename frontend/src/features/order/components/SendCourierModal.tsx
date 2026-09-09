'use client';

import React, { useState, useMemo } from 'react';
import { Truck, Loader2, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useBookCourierMutation, useGetCouriersDashboardQuery, CourierProvider } from '@/features/logistics/api/logisticsApi';
import { orderApi, Order } from '../api/orderApi';
import { useDispatch } from 'react-redux';

interface SendCourierModalProps {
  order: Order;
  onClose: () => void;
}

const PROVIDER_LABELS: Record<CourierProvider, string> = {
  STEADFAST: 'Steadfast',
  PATHAO: 'Pathao',
  PAPERFLY: 'Paperfly',
  REDX: 'RedX',
  CARRYBEE: 'Carrybee',
};

export function SendCourierModal({ order, onClose }: SendCourierModalProps) {
  const dispatch = useDispatch();
  const { data: dashboard, isLoading: isLoadingCouriers } = useGetCouriersDashboardQuery();
  const [bookCourier, { isLoading: isBooking }] = useBookCourierMutation();

  const [step, setStep] = useState<'select' | 'book'>('select');
  const [provider, setProvider] = useState<CourierProvider | null>(null);
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Every item ships by default — the merchant unchecks/adjusts to exclude.
  const [itemSelections, setItemSelections] = useState<Record<string, { included: boolean; quantity: number }>>(() =>
    Object.fromEntries((order.items ?? []).map((item) => [item.id, { included: true, quantity: item.quantity }])),
  );

  const connectedCouriers = useMemo(
    () => (dashboard?.couriers ?? []).filter((c) => c.isEnabled && c.status === 'Connected'),
    [dashboard],
  );

  const codAmount = order.paymentStatus === 'PAID' ? 0 : Number(order.grandTotal);

  const handleSelectProvider = (code: CourierProvider) => {
    setProvider(code);
    setStep('book');
  };

  const toggleItem = (itemId: string) => {
    setItemSelections((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], included: !prev[itemId].included },
    }));
  };

  const setItemQuantity = (itemId: string, quantity: number) => {
    setItemSelections((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity },
    }));
  };

  const includedCount = Object.values(itemSelections).filter((s) => s.included).length;
  const allIncluded = includedCount === (order.items?.length ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    setErrorMsg('');

    try {
      // Omit `items` entirely when everything ships — matches the backend default
      // and avoids sending a redundant full-item list on the common path.
      const items = allIncluded
        ? undefined
        : Object.entries(itemSelections)
            .filter(([, sel]) => sel.included && sel.quantity > 0)
            .map(([orderItemId, sel]) => ({ orderItemId, quantity: sel.quantity }));

      if (items && items.length === 0) {
        setErrorMsg('Select at least one item to ship.');
        return;
      }

      await bookCourier({
        orderId: order.id,
        courierProvider: provider,
        deliveryNote: note || undefined,
        items,
      }).unwrap();

      dispatch(orderApi.util.invalidateTags([{ type: 'Order', id: order.id }]));
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to book courier. Check your store courier settings.');
    }
  };

  const selectedLabel = provider ? PROVIDER_LABELS[provider] : '';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={step === 'select' ? 'Send Courier' : `Book with ${selectedLabel}`}
      subtitle={`Order #${order.orderNumber}`}
      icon={<Truck className="w-5 h-5" />}
      size="md"
      footer={
        step === 'book' ? (
          <>
            <button
              type="button"
              disabled={isBooking}
              onClick={() => setStep('select')}
              className="px-4 py-2.5 bg-white text-slate-700 text-sm font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="submit"
              form="send-courier-form"
              disabled={isBooking}
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
            >
              {isBooking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Booking...
                </>
              ) : (
                'Book Courier'
              )}
            </button>
          </>
        ) : undefined
      }
    >
      {step === 'select' ? (
        <div className="p-6">
          {isLoadingCouriers ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : connectedCouriers.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-bold text-slate-700 mb-1">No couriers connected</p>
              <p className="text-xs text-slate-500">Connect a courier under Store Settings → Couriers first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {connectedCouriers.map((courier) => (
                <button
                  key={courier.code}
                  type="button"
                  onClick={() => handleSelectProvider(courier.code)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all text-left"
                >
                  <div>
                    <p className="font-bold text-sm text-slate-900">{courier.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{courier.type}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form id="send-courier-form" onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          {/* Recipient */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Recipient</span>
              <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
              <p className="text-xs font-medium text-slate-500">{order.customerPhone}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Delivery Address</span>
              <p className="text-sm font-medium text-slate-700 leading-tight">{order.shippingAddress}, {order.city}</p>
            </div>
          </div>

          {/* Item checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Items to Ship ({includedCount}/{order.items?.length ?? 0})
            </label>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-52 overflow-y-auto">
              {(order.items ?? []).map((item) => {
                const sel = itemSelections[item.id];
                return (
                  <div key={item.id} className="p-3 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={sel?.included ?? true}
                      onChange={() => toggleItem(item.id)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${sel?.included ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                        {item.productTitle}
                      </p>
                      <p className="text-[10px] text-slate-400">Ordered: {item.quantity}</p>
                    </div>
                    {sel?.included && (
                      <input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={sel.quantity}
                        onChange={(e) => setItemQuantity(item.id, Math.min(item.quantity, Math.max(1, Number(e.target.value))))}
                        className="w-14 h-8 text-center text-xs font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* COD Amount */}
          <div className={`rounded-xl border p-4 flex justify-between items-center ${codAmount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div>
              <span className={`text-[10px] font-bold uppercase ${codAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>COD Amount</span>
              <p className="text-sm font-bold text-slate-900">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'}</p>
            </div>
            <p className="text-2xl font-black text-slate-900">৳{codAmount.toLocaleString()}</p>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Package / Instructions (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Fragile, call before delivery..."
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none min-h-[70px]"
            />
          </div>

          {!allIncluded && (
            <div className="flex items-center gap-2 text-[11px] text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Only the checked items will be recorded as shipped in this parcel.
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
