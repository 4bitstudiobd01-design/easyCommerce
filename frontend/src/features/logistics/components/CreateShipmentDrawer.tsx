'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Loader2, PackagePlus, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useGetMerchantOrdersQuery, type Order } from '@/features/order/api/orderApi';
import {
  useCreateShipmentMutation,
  useGetCourierProvidersQuery,
  type CourierProvider,
} from '../api/logisticsApi';
import { formatCurrency, formatShipmentDate } from '../utils/shipmentFormatters';

interface CreateShipmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Bulk mode keeps the drawer open after each parcel so several can be booked. */
  mode?: 'single' | 'bulk';
}

interface FormErrors {
  orderId?: string;
  courierProvider?: string;
  deliveryAddress?: string;
  customerPhone?: string;
  parcelWeight?: string;
  parcelDimensions?: string;
}

const PARCEL_TYPES = ['PARCEL', 'DOCUMENT', 'FRAGILE', 'LIQUID'];

const inputClass =
  'w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

const labelClass =
  'block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1';

/** Mirrors the server's `parcelDimensions` rule so the merchant is told early. */
const DIMENSIONS_PATTERN = /^\d{1,3}\s*[xX*]\s*\d{1,3}\s*[xX*]\s*\d{1,3}$/;

export const CreateShipmentDrawer = ({
  isOpen,
  onClose,
  mode = 'single',
}: CreateShipmentDrawerProps) => {
  const [orderSearch, setOrderSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [courierProvider, setCourierProvider] = useState<CourierProvider | ''>('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [parcelWeight, setParcelWeight] = useState('0.5');
  const [parcelType, setParcelType] = useState('PARCEL');
  const [parcelDimensions, setParcelDimensions] = useState('');
  const [codAmount, setCodAmount] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Generated once per parcel. Submitting twice — double-click, retry after a
   * flaky network — reuses this key, so the server returns the shipment it
   * already created instead of booking a second one.
   */
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const [createShipment, { isLoading: isSubmitting }] = useCreateShipmentMutation();
  const { data: couriers } = useGetCourierProvidersQuery();

  const newIdempotencyKey = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `shp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const resetForm = React.useCallback(() => {
    setOrderSearch('');
    setDebouncedSearch('');
    setSelectedOrder(null);
    setCourierProvider('');
    setPickupAddress('');
    setDeliveryAddress('');
    setCustomerPhone('');
    setParcelWeight('0.5');
    setParcelType('PARCEL');
    setParcelDimensions('');
    setCodAmount('');
    setDeliveryNote('');
    setSpecialInstructions('');
    setErrors({});
    setIdempotencyKey(newIdempotencyKey());
  }, []);

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen, resetForm]);

  // Escape closes, and the page behind must not scroll.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  // Debounce so typing an order number does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(orderSearch), 350);
    return () => clearTimeout(timer);
  }, [orderSearch]);

  const { data: ordersData, isFetching: isLoadingOrders } = useGetMerchantOrdersQuery(
    { page: 1, limit: 8, search: debouncedSearch || undefined, sortBy: 'createdAt', sortOrder: 'DESC' },
    { skip: !isOpen || Boolean(selectedOrder) },
  );

  // Orders that already concluded can never be shipped, so they are not offered.
  const selectableOrders = useMemo(
    () =>
      (ordersData?.data ?? []).filter(
        (order) =>
          !['CANCELLED', 'RETURNED', 'DELIVERED', 'COMPLETED'].includes(order.orderStatus),
      ),
    [ordersData],
  );

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setDeliveryAddress(order.shippingAddress ?? '');
    setCustomerPhone(order.customerPhone ?? '');
    // Prepaid orders carry no cash; COD orders default to the order total.
    const isPrepaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'COD_COLLECTED';
    setCodAmount(isPrepaid ? '0' : String(order.grandTotal ?? ''));
    setErrors((prev) => ({ ...prev, orderId: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!selectedOrder) nextErrors.orderId = 'Select the order this parcel is for.';
    if (!courierProvider) nextErrors.courierProvider = 'Choose a courier.';
    if (!deliveryAddress.trim()) nextErrors.deliveryAddress = 'A delivery address is required.';
    if (!customerPhone.trim()) nextErrors.customerPhone = 'A customer phone number is required.';

    const weight = Number(parcelWeight);
    if (!parcelWeight.trim() || Number.isNaN(weight) || weight <= 0) {
      nextErrors.parcelWeight = 'Enter a weight greater than 0.';
    } else if (weight > 100) {
      nextErrors.parcelWeight = 'Weight cannot exceed 100 kg.';
    }

    if (parcelDimensions.trim() && !DIMENSIONS_PATTERN.test(parcelDimensions.trim())) {
      nextErrors.parcelDimensions = 'Use the form 20x15x10 (LxWxH in cm).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || !selectedOrder || !courierProvider) return;

    try {
      const shipment = await createShipment({
        orderId: selectedOrder.id,
        courierProvider,
        pickupAddress: pickupAddress.trim() || undefined,
        deliveryAddress: deliveryAddress.trim(),
        customerPhone: customerPhone.trim(),
        parcelWeight: Number(parcelWeight),
        parcelType,
        parcelDimensions: parcelDimensions.trim() || undefined,
        codAmount: codAmount.trim() === '' ? undefined : Number(codAmount),
        deliveryNote: deliveryNote.trim() || undefined,
        specialInstructions: specialInstructions.trim() || undefined,
        idempotencyKey,
      }).unwrap();

      toast.success(
        shipment.trackingCode
          ? `${shipment.shipmentNumber} booked with ${shipment.courierName}.`
          : `${shipment.shipmentNumber} created. Courier booking is still pending.`,
      );

      if (mode === 'bulk') {
        // Keep the drawer open so the merchant can book the next parcel, but
        // start a fresh idempotency key for it.
        resetForm();
      } else {
        onClose();
      }
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        (status === 403
          ? 'You do not have permission to create shipments.'
          : 'Could not create the shipment. Please try again.');
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close create shipment"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
      />

      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-label="Create shipment"
        className="relative w-full max-w-md bg-slate-50 h-full overflow-y-auto shadow-2xl flex flex-col"
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              {mode === 'bulk' ? 'Bulk Shipment' : 'Create Shipment'}
            </h2>
            {mode === 'bulk' && (
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                The form stays open so you can book several parcels.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4 flex-1">
          {/* ORDER SELECTION */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4">
            <h3 className="text-xs font-bold text-slate-900 mb-2.5">Order</h3>

            {selectedOrder ? (
              <div className="flex items-start justify-between gap-3 p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    #{selectedOrder.orderNumber}
                  </p>
                  <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                    {selectedOrder.customerName} · {selectedOrder.customerPhone}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                    {formatCurrency(selectedOrder.grandTotal)} ·{' '}
                    {formatShipmentDate(selectedOrder.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setOrderSearch('');
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search order number, customer or phone..."
                    aria-label="Search orders"
                    className={`${inputClass} !pl-9`}
                  />
                </div>

                <div className="mt-2 max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
                  {isLoadingOrders ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      Loading orders...
                    </div>
                  ) : selectableOrders.length === 0 ? (
                    <p className="p-4 text-[11px] font-medium text-slate-400 text-center">
                      No shippable orders found.
                    </p>
                  ) : (
                    selectableOrders.map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => handleSelectOrder(order)}
                        className="w-full text-left p-2.5 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:bg-slate-50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-900">
                            #{order.orderNumber}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 shrink-0">
                            {formatCurrency(order.grandTotal)}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
                          {order.customerName} · {order.orderStatus.replace(/_/g, ' ')}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {errors.orderId && (
              <p className="mt-1.5 text-[10px] font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {errors.orderId}
              </p>
            )}
          </section>

          {/* COURIER */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4">
            <h3 className="text-xs font-bold text-slate-900 mb-2.5">Courier</h3>
            <div className="grid grid-cols-2 gap-2">
              {(couriers ?? []).map((courier) => {
                const isSelected = courierProvider === courier.code;
                return (
                  <button
                    key={courier.code}
                    type="button"
                    onClick={() => {
                      setCourierProvider(courier.code);
                      setErrors((prev) => ({ ...prev, courierProvider: undefined }));
                    }}
                    aria-pressed={isSelected}
                    className={`px-3 py-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{courier.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            {errors.courierProvider && (
              <p className="mt-1.5 text-[10px] font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {errors.courierProvider}
              </p>
            )}
          </section>

          {/* ADDRESSES */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900">Addresses</h3>

            <label className="block">
              <span className={labelClass}>Pickup Address</span>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Defaults to your store address"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>
                Delivery Address <span className="text-red-500">*</span>
              </span>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={2}
                required
                aria-invalid={Boolean(errors.deliveryAddress)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-none"
              />
              {errors.deliveryAddress && (
                <span className="mt-1 text-[10px] font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />
                  {errors.deliveryAddress}
                </span>
              )}
            </label>

            <label className="block">
              <span className={labelClass}>
                Customer Phone <span className="text-red-500">*</span>
              </span>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+8801712345678"
                required
                aria-invalid={Boolean(errors.customerPhone)}
                className={inputClass}
              />
              {errors.customerPhone && (
                <span className="mt-1 text-[10px] font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />
                  {errors.customerPhone}
                </span>
              )}
            </label>
          </section>

          {/* PARCEL */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900">Parcel</h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>
                  Weight (kg) <span className="text-red-500">*</span>
                </span>
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={parcelWeight}
                  onChange={(e) => setParcelWeight(e.target.value)}
                  required
                  aria-invalid={Boolean(errors.parcelWeight)}
                  className={inputClass}
                />
                {errors.parcelWeight && (
                  <span className="mt-1 text-[10px] font-bold text-red-600 block">
                    {errors.parcelWeight}
                  </span>
                )}
              </label>

              <label className="block">
                <span className={labelClass}>Parcel Type</span>
                <select
                  value={parcelType}
                  onChange={(e) => setParcelType(e.target.value)}
                  className={inputClass}
                >
                  {PARCEL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Dimensions (cm)</span>
                <input
                  type="text"
                  value={parcelDimensions}
                  onChange={(e) => setParcelDimensions(e.target.value)}
                  placeholder="20x15x10"
                  aria-invalid={Boolean(errors.parcelDimensions)}
                  className={inputClass}
                />
                {errors.parcelDimensions && (
                  <span className="mt-1 text-[10px] font-bold text-red-600 block">
                    {errors.parcelDimensions}
                  </span>
                )}
              </label>

              <label className="block">
                <span className={labelClass}>COD Amount</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={codAmount}
                  onChange={(e) => setCodAmount(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Delivery Note</span>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="Call before delivery"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Special Instructions</span>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Fragile — handle with care"
                className={inputClass}
              />
            </label>
          </section>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 px-5 py-3.5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {mode === 'bulk' ? 'Done' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <PackagePlus className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {isSubmitting ? 'Creating...' : 'Create Shipment'}
          </button>
        </div>
      </form>
    </div>
  );
};
