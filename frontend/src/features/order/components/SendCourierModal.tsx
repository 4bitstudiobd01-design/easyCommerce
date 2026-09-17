'use client';

import React, { useState, useMemo } from 'react';
import { Truck, Loader2, ChevronRight, ArrowLeft, CheckCircle2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import {
  useBookCourierMutation,
  useGetCouriersDashboardQuery,
  useListPathaoStoresQuery,
  useGetPathaoCitiesQuery,
  useGetPathaoZonesQuery,
  useCalculatePathaoPriceMutation,
  useGetRedxAreasQuery,
  CourierProvider,
} from '@/features/logistics/api/logisticsApi';
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

  // Pathao-only: an optional delivery-fee estimate before booking. Selecting a
  // city/zone here never changes what gets booked — Pathao's own order API
  // resolves the destination from the free-text address when city/zone are
  // omitted, so this is purely informational.
  const [priceCityId, setPriceCityId] = useState<number | ''>('');
  const [priceZoneId, setPriceZoneId] = useState<number | ''>('');
  const { data: pathaoStores } = useListPathaoStoresQuery(undefined, { skip: provider !== 'PATHAO' });
  const { data: pathaoCities, isLoading: isLoadingPathaoCities } = useGetPathaoCitiesQuery(undefined, {
    skip: provider !== 'PATHAO',
  });
  const { data: pathaoZones, isLoading: isLoadingPathaoZones } = useGetPathaoZonesQuery(
    Number(priceCityId),
    { skip: provider !== 'PATHAO' || !priceCityId },
  );
  const [calculatePrice, { data: priceEstimate, isLoading: isCalculatingPrice }] =
    useCalculatePathaoPriceMutation();
  const activePathaoStore = pathaoStores?.find((s) => s.isActive) ?? pathaoStores?.[0];

  const handleEstimatePrice = async () => {
    if (!activePathaoStore || !priceCityId || !priceZoneId) return;
    try {
      await calculatePrice({
        storeId: activePathaoStore.storeId,
        itemType: 2,
        deliveryType: 48,
        itemWeight: 0.5,
        recipientCity: Number(priceCityId),
        recipientZone: Number(priceZoneId),
      }).unwrap();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? 'Could not calculate the delivery fee.';
      toast.error(message);
    }
  };

  // RedX only: required. RedX has no free-text address resolver, so the
  // merchant must pick a delivery area before booking — unlike Pathao's city/
  // zone above, this one IS sent with the booking.
  const [redxAreaId, setRedxAreaId] = useState<number | ''>('');
  const { data: redxAreas, isLoading: isLoadingRedxAreas } = useGetRedxAreasQuery(undefined, {
    skip: provider !== 'REDX',
  });

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

    if (provider === 'REDX' && !redxAreaId) {
      setErrorMsg('Select a RedX delivery area before booking.');
      return;
    }

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
        redxDeliveryAreaId: provider === 'REDX' ? Number(redxAreaId) : undefined,
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

          {/* RedX delivery area — required. RedX has no free-text address resolver. */}
          {provider === 'REDX' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Delivery Area (required)
              </label>
              <select
                value={redxAreaId}
                disabled={isLoadingRedxAreas}
                onChange={(e) => setRedxAreaId(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">
                  {isLoadingRedxAreas ? 'Loading areas…' : 'Select the RedX delivery area'}
                </option>
                {redxAreas?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.divisionName})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1.5">
                RedX requires the exact delivery area — pick the closest match to the customer's address.
              </p>
            </div>
          )}

          {/* Pathao delivery-fee estimate — informational only, never sent with the booking */}
          {provider === 'PATHAO' && (
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-slate-400" />
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Estimate Pathao Delivery Fee (optional)
                </label>
              </div>
              {!activePathaoStore ? (
                <p className="text-[11px] text-slate-400">
                  Create a Pathao store under Store Settings → Couriers to estimate a fee.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={priceCityId}
                      disabled={isLoadingPathaoCities}
                      onChange={(e) => {
                        setPriceCityId(e.target.value ? Number(e.target.value) : '');
                        setPriceZoneId('');
                      }}
                      className="h-9 px-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="">{isLoadingPathaoCities ? 'Loading…' : 'City'}</option>
                      {pathaoCities?.map((c) => (
                        <option key={c.cityId} value={c.cityId}>
                          {c.cityName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={priceZoneId}
                      disabled={!priceCityId || isLoadingPathaoZones}
                      onChange={(e) => setPriceZoneId(e.target.value ? Number(e.target.value) : '')}
                      className="h-9 px-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="">{isLoadingPathaoZones ? 'Loading…' : 'Zone'}</option>
                      {pathaoZones?.map((z) => (
                        <option key={z.zoneId} value={z.zoneId}>
                          {z.zoneName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleEstimatePrice}
                    disabled={!priceCityId || !priceZoneId || isCalculatingPrice}
                    className="w-full h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {isCalculatingPrice ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Estimate fee'
                    )}
                  </button>
                  {priceEstimate && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Pathao delivery fee</span>
                      <span className="font-bold text-slate-900">৳{priceEstimate.finalPrice.toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

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
