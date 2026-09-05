'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, Loader2, MapPin, ShieldCheck } from 'lucide-react';
import { RootState } from '@/store';
import { clearCart } from '@/features/storefront/slices/cartSlice';
import { clearCheckoutDraft } from '@/features/storefront/slices/checkoutSlice';
import { useCreatePublicOrderMutation, Order } from '@/features/order/api/orderApi';
import { useInitiatePaymentMutation } from '@/features/payment/api/paymentApi';
import { useGetPublicStoreProductsQuery } from '@/features/storefront/api/storefrontApi';
import { readStoredAttribution, readStoredSessionId } from '@/features/storefront/utils/attribution';
import { ShopEaseNavbar } from '@/features/storefront/components/ShopEaseNavbar';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import { OrderConfirmedCard } from './OrderConfirmedCard';

/**
 * The pre-confirmation review page: /store/[slug]/checkout/review. It reads the
 * form draft saved by CheckoutView plus the cart, shows the full order preview,
 * and only places the order when the customer presses "Confirm & Place Order".
 */
export function CheckoutReviewView({ storeSlugFromRoute }: { storeSlugFromRoute?: string }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const draft = useSelector((state: RootState) => state.checkout.draft);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const customerAuth = useSelector((state: RootState) => (state as any).customerAuth);
  const loggedInCustomer = customerAuth?.customer;
  const authUser = useSelector((state: RootState) => (state as any).auth?.user);

  const storeSlug = storeSlugFromRoute || draft?.storeSlug || cartItems[0]?.storeSlug || '';

  const { data: storeData } = useGetPublicStoreProductsQuery({ slug: storeSlug }, { skip: !storeSlug });
  const store = storeData?.store;
  const primaryColor = (store as any)?.primaryColor || '#2563eb';

  // productId -> display name, used to fill in cart lines that were stored before
  // the cart started saving the product name (older drafts had a blank title).
  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    (storeData?.products || []).forEach((p: any) => {
      if (p?.id) map.set(p.id, p.name || p.title || '');
    });
    return map;
  }, [storeData]);

  const displayName = (i: { productId: string; title?: string }) =>
    i.title && i.title !== 'Product' ? i.title : productNameById.get(i.productId) || i.title || 'Product';

  const [createOrder, { isLoading: isCreatingOrder }] = useCreatePublicOrderMutation();
  const [initiatePayment, { isLoading: isInitiatingPayment }] = useInitiatePaymentMutation();
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const isSubmitting = isCreatingOrder || isInitiatingPayment;

  const insideDhakaCharge = Number(store?.deliveryChargeInsideDhaka ?? 60);
  const outsideDhakaCharge = Number(store?.deliveryChargeOutsideDhaka ?? 120);
  const shippingMethod = draft?.shippingMethod ?? 'standard';
  const shippingCharge = shippingMethod === 'express' ? outsideDhakaCharge : insideDhakaCharge;

  const subtotal = useMemo(
    () => cartItems.reduce((acc, i) => acc + (i.price || (i as any).basePrice || 0) * i.quantity, 0),
    [cartItems],
  );
  const discount = draft?.appliedCoupon?.discountAmount || 0;
  const grandTotal = Math.max(0, subtotal + shippingCharge - discount);

  // If there's no draft or an empty cart, the review page has nothing to show —
  // send the customer back to checkout. (Skip once an order has been placed.)
  useEffect(() => {
    if (completedOrder) return;
    if (!draft || cartItems.length === 0) {
      router.replace(storeSlug ? `/store/${storeSlug}/checkout` : '/checkout');
    }
  }, [draft, cartItems.length, completedOrder, router, storeSlug]);

  if (completedOrder) {
    return (
      <OrderConfirmedCard
        order={completedOrder}
        storeName={store?.name}
        storeSlug={storeSlug}
        primaryColor={primaryColor}
        shippingMethod={shippingMethod}
        paymentMethod={draft?.paymentMethod ?? 'COD'}
      />
    );
  }

  if (!draft || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-xs font-bold text-slate-500">
        Redirecting to checkout…
      </div>
    );
  }

  // Join only the parts the store actually collected — fields the merchant hid at
  // checkout come through as empty strings and must not leave stray commas.
  const addressLine = [draft.address, draft.cityArea, draft.district, draft.division]
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(', ');
  const fullAddress = draft.zipCode?.trim()
    ? `${addressLine}${addressLine ? ' - ' : ''}${draft.zipCode.trim()}`
    : addressLine;

  const handleConfirm = async () => {
    setErrorMsg('');
    try {
      const attribution = readStoredAttribution();
      const sessionId = readStoredSessionId();
      const formattedPhone = draft.countryCode + draft.phoneNumber.replace(/\D/g, '');
      const isGuest = !loggedInCustomer && !authUser;
      const authenticatedUserId = loggedInCustomer?.id || authUser?.id || undefined;

      const order = await createOrder({
        storeSlug,
        customerName: draft.fullName,
        customerPhone: formattedPhone,
        customerEmail: draft.emailAddress || undefined,
        shippingAddress: fullAddress,
        city: draft.cityArea || draft.district || 'Dhaka',
        deliveryZone: shippingMethod === 'express' ? 'OUTSIDE_DHAKA' : 'INSIDE_DHAKA',
        paymentMethod: draft.paymentMethod === 'COD' ? 'COD' : 'SSLCOMMERZ',
        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variantId: i.variantId,
        })),
        channel: attribution?.channel,
        utmSource: attribution?.utmSource,
        utmMedium: attribution?.utmMedium,
        utmCampaign: attribution?.utmCampaign,
        referrerHost: attribution?.referrerHost,
        sessionId: sessionId || undefined,
        userId: authenticatedUserId,
        isGuest,
        couponCode: draft.appliedCoupon ? draft.appliedCoupon.code : undefined,
      }).unwrap();

      // Online payment — hand off to the gateway.
      if (draft.paymentMethod !== 'COD') {
        try {
          const paymentRes = await initiatePayment({ orderId: order.id }).unwrap();
          if (paymentRes.gatewayUrl) {
            dispatch(clearCart());
            dispatch(clearCheckoutDraft());
            toast.success('Redirecting to payment gateway...');
            window.location.href = paymentRes.gatewayUrl;
            return;
          }
        } catch {
          toast.info('Order placed! Redirecting to payment...');
        }
      }

      // COD or fallback — show the confirmation.
      dispatch(clearCart());
      dispatch(clearCheckoutDraft());
      setCompletedOrder(order);
      toast.success('Order placed successfully!');
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to place order. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const zoneLabel = shippingMethod === 'express' ? 'Outside Dhaka' : 'Inside Dhaka';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans" style={{ ['--brand' as any]: primaryColor }}>
      <ShopEaseNavbar
        storeName={store?.name}
        slug={storeSlug || 'main'}
        logo={store?.logo}
        primaryColor={primaryColor}
        activeTab="shop"
      />
      <CartDrawer primaryColor={primaryColor} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Review your order</h1>
            <p className="text-xs text-slate-500 mt-1">
              Please check everything below before placing your order.
            </p>
          </div>
          <Link
            href={storeSlug ? `/store/${storeSlug}/checkout` : '/checkout'}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl px-4 py-3">
            {errorMsg}
          </div>
        )}

        {/* Shipping details */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Shipping to
          </h2>
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">{draft.fullName}</p>
            <p>{draft.countryCode} {draft.phoneNumber}</p>
            {draft.emailAddress && <p>{draft.emailAddress}</p>}
            {fullAddress && <p>{fullAddress}</p>}
            {draft.orderNote && <p className="text-slate-400">Note: {draft.orderNote}</p>}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Delivery area</span>
            <span className="font-bold text-slate-900">{zoneLabel} — ৳{shippingCharge}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Payment method</span>
            <span className="font-bold text-slate-900">{draft.paymentMethod}</span>
          </div>
        </section>

        {/* Items */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
            Items ({cartItems.reduce((a, i) => a + i.quantity, 0)})
          </h2>
          <div className="space-y-2.5">
            {cartItems.map((i) => (
              <div key={i.id} className="flex justify-between gap-3 text-xs">
                <span className="text-slate-600">
                  {displayName(i)}
                  {i.variantTitle ? ` (${i.variantTitle})` : ''}{' '}
                  <span className="text-slate-400">× {i.quantity}</span>
                </span>
                <span className="font-semibold text-slate-900 shrink-0">
                  ৳ {((i.price || 0) * i.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Totals */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold text-slate-900">৳ {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Delivery charge ({zoneLabel})</span>
            <span className="font-semibold text-slate-900">৳ {shippingCharge.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount{draft.appliedCoupon ? ` (${draft.appliedCoupon.code})` : ''}</span>
              <span className="font-semibold">− ৳ {discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-900">Grand Total</span>
            <span className="font-extrabold" style={{ color: primaryColor }}>
              ৳ {grandTotal.toLocaleString()}
            </span>
          </div>
        </section>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="w-full h-12 hover:brightness-110 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: primaryColor }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Placing your order…</span>
            </>
          ) : (
            <span>
              {draft.paymentMethod === 'COD' ? 'Confirm & Place Order' : 'Confirm & Proceed to Payment'}
            </span>
          )}
        </button>

        <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Your order is placed only after you press Confirm.
        </p>
      </main>
    </div>
  );
}
