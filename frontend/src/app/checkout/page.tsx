'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { clearCart } from '@/features/storefront/slices/cartSlice';
import { useCreatePublicOrderMutation, Order } from '@/features/order/api/orderApi';
import { useInitiatePaymentMutation } from '@/features/payment/api/paymentApi';
import { useValidatePublicCouponMutation } from '@/features/coupon/api/couponApi';
import Link from 'next/link';
import {
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Truck,
  MapPin,
  Phone,
  User,
  Mail,
  ArrowRight,
  Store as StoreIcon,
  Sparkles,
  Globe,
  Lock,
  Tag,
} from 'lucide-react';

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'SSLCOMMERZ'>('SSLCOMMERZ');
  const [errorMsg, setErrorMsg] = useState('');

  // Promo Coupon state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [promoSuccessMsg, setPromoSuccessMsg] = useState('');
  const [promoErrorMsg, setPromoErrorMsg] = useState('');

  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const [createOrder, { isLoading: isCreatingOrder }] = useCreatePublicOrderMutation();
  const [initiatePayment, { isLoading: isInitiatingPayment }] = useInitiatePaymentMutation();
  const [validateCoupon, { isLoading: isValidatingCoupon }] = useValidatePublicCouponMutation();

  const isSubmitting = isCreatingOrder || isInitiatingPayment;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = city.toLowerCase().includes('dhaka') ? 60 : 120;
  const grandTotal = Math.max(0, subtotal + deliveryFee - appliedDiscount);

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setPromoErrorMsg('');
    setPromoSuccessMsg('');

    const storeSlug = new URLSearchParams(window.location.search).get('storeSlug') || localStorage.getItem('easycommerce_store_slug') || 'demo-store';

    try {
      const result = await validateCoupon({
        storeSlug,
        code: promoCodeInput,
        subtotal,
      }).unwrap();

      setAppliedDiscount(result.calculatedDiscount);
      setAppliedCouponCode(result.code);
      setPromoSuccessMsg(result.message);
    } catch (err: any) {
      setAppliedDiscount(0);
      setAppliedCouponCode('');
      setPromoErrorMsg(err?.data?.message || 'Invalid promo coupon code.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cartItems.length === 0) {
      setErrorMsg('Your cart is empty. Add items before checking out.');
      return;
    }

    try {
      const order = await createOrder({
        storeSlug: 'darucinifashon', // Default storefront slug
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        shippingAddress,
        city,
        paymentMethod: paymentMethod === 'SSLCOMMERZ' ? 'SSLCOMMERZ' : 'COD',
        couponCode: appliedCouponCode || undefined,
        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      }).unwrap();

      if (paymentMethod === 'SSLCOMMERZ') {
        const paymentRes = await initiatePayment({ orderId: order.id }).unwrap();
        dispatch(clearCart());
        if (paymentRes?.gatewayUrl) {
          window.location.href = paymentRes.gatewayUrl;
          return;
        }
      }

      setCompletedOrder(order);
      dispatch(clearCart());
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to place order. Please try again.');
    }
  };

  // SUCCESS SCREEN FOR COD
  if (completedOrder) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-lg shadow-emerald-600/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full">
              Order Placed Successfully!
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
              Order Invoice #{completedOrder.orderNumber}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Thank you for shopping with us! A representative will call you at <span className="font-bold text-slate-900">{completedOrder.customerPhone}</span> to confirm delivery.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Customer:</span>
              <span className="font-bold text-slate-900">{completedOrder.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Address:</span>
              <span className="font-bold text-slate-900">{completedOrder.shippingAddress}, {completedOrder.city}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Method:</span>
              <span className="font-bold text-blue-600">{completedOrder.paymentMethod} (Cash on Delivery)</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
              <span>Total Payable Amount:</span>
              <span className="text-emerald-600">৳{Number(completedOrder.grandTotal).toLocaleString()}</span>
            </div>
          </div>

          <Link
            href="/store/darucinifashon"
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-blue-600/20"
          >
            <StoreIcon className="w-4 h-4" />
            <span>Return to Digital Storefront</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <StoreIcon className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">EasyCommerce Secure Checkout</span>
          </Link>
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>SSLCommerz Secured Payment Gateway</span>
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Checkout Form (Left 7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Shipping & Customer Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter delivery details for your order parcel</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Sumon Islam"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Phone & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="01700000000"
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@gmail.com"
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* City Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Delivery City / Region
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  >
                    <option value="Dhaka">Inside Dhaka (৳60 Delivery Charge)</option>
                    <option value="Outside Dhaka">Outside Dhaka (৳120 Delivery Charge)</option>
                  </select>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Delivery Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="House #, Road #, Area, Landmark..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>

              {/* Payment Method Options */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Select Payment Gateway
                </label>

                <div className="space-y-3">
                  {/* SSLCommerz Option */}
                  <label
                    onClick={() => setPaymentMethod('SSLCOMMERZ')}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'SSLCOMMERZ'
                        ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 block flex items-center gap-2">
                          <span>SSLCommerz Online Payment</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full">
                            RECOMMENDED
                          </span>
                        </span>
                        <span className="text-xs text-slate-500 font-medium block mt-0.5">
                          Pay instantly via <span className="font-bold text-pink-600">bKash</span>, <span className="font-bold text-orange-600">Nagad</span>, Visa, Mastercard, DBBL Rocket
                        </span>
                      </div>
                    </div>
                    <input type="radio" checked={paymentMethod === 'SSLCOMMERZ'} readOnly className="w-4 h-4 text-blue-600" />
                  </label>

                  {/* Cash on Delivery Option */}
                  <label
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">Cash on Delivery (COD)</span>
                        <span className="text-xs text-slate-500 font-medium">Pay cash to courier agent upon parcel arrival</span>
                      </div>
                    </div>
                    <input type="radio" checked={paymentMethod === 'COD'} readOnly className="w-4 h-4 text-blue-600" />
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full mt-6 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all text-base shadow-xl shadow-blue-600/25 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Connecting to SSLCommerz Gateway...</span>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>
                      {paymentMethod === 'SSLCOMMERZ' ? 'Pay Online with SSLCommerz' : 'Confirm Order COD'} • ৳{grandTotal.toLocaleString()}
                    </span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Summary Sidebar (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
                Order Summary ({cartItems.length} items)
              </h3>

              <div className="divide-y divide-slate-100 space-y-3 max-h-80 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.productId} className="pt-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.title}</span>
                      <span className="text-slate-400">Qty: {item.quantity} x ৳{item.price}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">৳{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Promo Coupon Code Box */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Have a Promo Code / Coupon?
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. EASY20"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromoCode}
                    disabled={isValidatingCoupon || !promoCodeInput.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isValidatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </div>

                {promoSuccessMsg && (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{promoSuccessMsg}</span>
                  </p>
                )}

                {promoErrorMsg && (
                  <p className="text-[11px] font-bold text-red-600 mt-1">
                    {promoErrorMsg}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">৳{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Delivery Charge ({city})</span>
                  <span className="font-bold text-slate-900">৳{deliveryFee}</span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Promo Coupon Discount</span>
                    <span>-৳{appliedDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between font-black text-lg text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-blue-600">৳{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
