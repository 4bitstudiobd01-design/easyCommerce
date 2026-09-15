'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useValidatePublicCouponMutation } from '@/features/coupon/api/couponApi';
import { useTrackAbandonedCartMutation } from '@/features/order/api/orderApi';
import { useGetPublicStoreProductsQuery } from '@/features/storefront/api/storefrontApi';
import { CustomerAuthModal } from '@/features/storefront/components/CustomerAuthModal';
import { ShopEaseNavbar } from '@/features/storefront/components/ShopEaseNavbar';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import { setCheckoutDraft } from '@/features/storefront/slices/checkoutSlice';
import {
  ChevronDown,
  Truck,
  Rocket,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  Banknote,
  Tag,
  Loader2,
} from 'lucide-react';

/**
 * The full checkout experience. `storeSlugFromRoute` is passed when this renders
 * under the store-scoped route (/store/[slug]/checkout); the legacy /checkout
 * route renders it with no prop and the slug is recovered from the cart instead.
 */
export function CheckoutView({ storeSlugFromRoute }: { storeSlugFromRoute?: string }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const rawCartItems = useSelector((state: RootState) => state.cart.items);
  const activeCartItems = rawCartItems;
  const savedDraft = useSelector((state: RootState) => state.checkout.draft);

  // Form states — pre-filled from a saved draft so a customer who came back from
  // the review page still sees everything they entered.
  const [fullName, setFullName] = useState(savedDraft?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(savedDraft?.phoneNumber ?? '');
  const [countryCode, setCountryCode] = useState(savedDraft?.countryCode ?? '+880');
  const [emailAddress, setEmailAddress] = useState(savedDraft?.emailAddress ?? '');
  const [address, setAddress] = useState(savedDraft?.address ?? '');
  const [country, setCountry] = useState(savedDraft?.country ?? 'Bangladesh');
  const [division, setDivision] = useState(savedDraft?.division ?? 'Dhaka');
  const [district, setDistrict] = useState(savedDraft?.district ?? 'Dhaka');
  const [cityArea, setCityArea] = useState(savedDraft?.cityArea ?? '');
  const [zipCode, setZipCode] = useState(savedDraft?.zipCode ?? '');
  const [orderNote, setOrderNote] = useState(savedDraft?.orderNote ?? '');

  // Shipping & Payment selection
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>(
    savedDraft?.shippingMethod ?? 'standard',
  );
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BKASH' | 'NAGAD' | 'CARD'>(
    savedDraft?.paymentMethod ?? 'COD',
  );

  const [errorMsg, setErrorMsg] = useState('');
  const customerAuth = useSelector((state: RootState) => (state as any).customerAuth);
  const loggedInCustomer = customerAuth?.customer;
  const authUser = useSelector((state: RootState) => (state as any).auth?.user);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Coupon
  const [couponCode, setCouponCode] = useState(savedDraft?.appliedCoupon?.code ?? '');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(
    savedDraft?.appliedCoupon ?? null,
  );
  const [couponError, setCouponError] = useState('');
  const [validateCoupon, { isLoading: isValidatingCoupon }] = useValidatePublicCouponMutation();
  const [trackAbandonedCart] = useTrackAbandonedCartMutation();

  const isSubmitting = false;

  // Cached in a ref (not just derived from the cart) so it survives clearCart() —
  // the cart empties right after a successful order, but the confirmation screen
  // still needs to know which store to link back to. The route slug (when present)
  // is authoritative; otherwise fall back to the cart's stored storeSlug.
  const storeSlugRef = React.useRef('');
  if (storeSlugFromRoute) {
    storeSlugRef.current = storeSlugFromRoute;
  } else if (activeCartItems[0]?.storeSlug) {
    storeSlugRef.current = activeCartItems[0].storeSlug;
  }
  const storeSlug = storeSlugRef.current;

  const { data: storeData } = useGetPublicStoreProductsQuery({ slug: storeSlug }, { skip: !storeSlug });
  const store = storeData?.store;
  const primaryColor = (store as any)?.primaryColor || '#2563eb';

  const guestCheckoutEnabled = store?.guestCheckoutEnabled ?? true;
  const showCouponFieldAtCheckout = store?.showCouponFieldAtCheckout ?? true;
  const minimumOrderAmount = store?.minimumOrderAmount ?? 0;

  // Per-field show/required rules from store settings, with the historical
  // defaults as a fallback (all shown; address/country/division/district/area
  // required; email/zip/note optional).
  const DEFAULT_FIELD_CONFIG = {
    email: { show: true, required: false },
    address: { show: true, required: true },
    country: { show: true, required: true },
    division: { show: true, required: true },
    district: { show: true, required: true },
    cityArea: { show: true, required: true },
    zipCode: { show: true, required: false },
    orderNote: { show: true, required: false },
  } as const;
  type FieldKey = keyof typeof DEFAULT_FIELD_CONFIG;
  const fieldCfg = (key: FieldKey) =>
    (store?.checkoutFieldConfig as Record<string, { show: boolean; required: boolean }> | undefined)?.[key] ??
    DEFAULT_FIELD_CONFIG[key];
  const showField = (key: FieldKey) => fieldCfg(key).show;
  const isRequired = (key: FieldKey) => fieldCfg(key).show && fieldCfg(key).required;

  const showOrderNoteFieldAtCheckout = showField('orderNote');

  // Small label suffix: red * when required, "(Optional)" otherwise.
  const reqMark = (key: FieldKey) =>
    isRequired(key) ? (
      <span className="text-red-500">*</span>
    ) : (
      <span className="text-slate-400 font-normal">(Optional)</span>
    );

  // Autofill customer profile if logged in or previously ordered
  React.useEffect(() => {
    // 1. If storefront customer is authenticated, prefill default profile info
    if (loggedInCustomer) {
      const name = `${loggedInCustomer.firstName || ''} ${loggedInCustomer.lastName || ''}`.trim();
      if (name) setFullName(name);
      if (loggedInCustomer.email) setEmailAddress(loggedInCustomer.email);
      if (loggedInCustomer.phone) {
        let p = loggedInCustomer.phone.replace(/\D/g, '');
        if (p.startsWith('880')) {
          p = p.slice(3);
          setCountryCode('+880');
        } else if (p.startsWith('0')) {
          p = p.slice(1);
          setCountryCode('+880');
        }
        setPhoneNumber(p);
      }
      return;
    }

    // 2. Fallback to localStorage cache for guest shoppers
    try {
      const stored = localStorage.getItem(`bitcommerce_customer_${storeSlug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setFullName(parsed.name);
        if (parsed.phone) setPhoneNumber(parsed.phone);
        if (parsed.email) setEmailAddress(parsed.email);
      }
    } catch (e) {}
  }, [loggedInCustomer, storeSlug]);

  // Delivery charges by zone come from store settings (falling back to the old
  // flat defaults). `shippingMethod` now means the zone: 'standard' = inside
  // Dhaka, 'express' = outside Dhaka.
  const insideDhakaCharge = Number(store?.deliveryChargeInsideDhaka ?? 60);
  const outsideDhakaCharge = Number(store?.deliveryChargeOutsideDhaka ?? 120);

  // Price calculations
  const itemsCount = activeCartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = activeCartItems.reduce((acc, item) => acc + (item.price || (item as any).basePrice || 0) * item.quantity, 0);
  const shippingCharge = shippingMethod === 'express' ? outsideDhakaCharge : insideDhakaCharge;
  const discount = appliedCoupon?.discountAmount || 0;
  const totalAmount = Math.max(0, subtotal + shippingCharge - discount);

  const isBelowMinimumOrder = minimumOrderAmount > 0 && subtotal < minimumOrderAmount;
  const blockedByGuestCheckout = !guestCheckoutEnabled && !loggedInCustomer && !authUser;

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim() || !storeSlug) return;
    try {
      const result = await validateCoupon({ storeSlug, code: couponCode.trim(), subtotal }).unwrap();
      if (result.isValid) {
        setAppliedCoupon({ code: result.code, discountAmount: result.calculatedDiscount });
        toast.success(result.message || 'Coupon applied!');
      } else {
        setAppliedCoupon(null);
        setCouponError(result.message || 'This coupon is not valid.');
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err?.data?.message || 'Failed to validate coupon.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // "Review Order" — validate, save the form as a draft, then go to the review
  // page where the order is actually placed.
  const handleReviewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Full Name and Phone are always required; the rest follow the store config.
    const missing: string[] = [];
    if (!fullName.trim()) missing.push('Full Name');
    if (!phoneNumber.trim()) missing.push('Phone Number');
    if (isRequired('email') && !emailAddress.trim()) missing.push('Email Address');
    if (isRequired('address') && !address.trim()) missing.push('Address');
    if (isRequired('division') && !division.trim()) missing.push('Division');
    if (isRequired('district') && !district.trim()) missing.push('District');
    if (isRequired('cityArea') && !cityArea.trim()) missing.push('City/Area');
    if (isRequired('zipCode') && !zipCode.trim()) missing.push('Zip Code');

    if (missing.length > 0) {
      const msg = `Please fill in: ${missing.join(', ')}.`;
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (blockedByGuestCheckout) {
      setErrorMsg('Please log in to your account to place an order.');
      toast.error('Please log in to continue — guest checkout is disabled for this store.');
      setIsAuthModalOpen(true);
      return;
    }

    if (isBelowMinimumOrder) {
      setErrorMsg(`Minimum order amount is ৳${minimumOrderAmount.toLocaleString()}.`);
      toast.error(`Minimum order amount is ৳${minimumOrderAmount.toLocaleString()}.`);
      return;
    }

    dispatch(
      setCheckoutDraft({
        storeSlug,
        fullName,
        countryCode,
        phoneNumber,
        emailAddress,
        address,
        country,
        division,
        district,
        cityArea,
        zipCode,
        orderNote,
        shippingMethod,
        paymentMethod,
        appliedCoupon: showCouponFieldAtCheckout ? appliedCoupon : null,
      }),
    );

    // Record this as an abandoned cart — the customer has entered full checkout
    // details but hasn't placed the order yet. Fire-and-forget: a failure here
    // must never block the customer from reaching the review page. The backend
    // dedupes on (tenantId, phone) and clears it once the order is placed.
    if (storeSlug) {
      const trackedPhone = countryCode + phoneNumber.replace(/\D/g, '');
      const shippingAddress = [address, cityArea, district, division, zipCode]
        .map((p) => (p || '').trim())
        .filter(Boolean)
        .join(', ');
      trackAbandonedCart({
        storeSlug,
        customerPhone: trackedPhone,
        customerName: fullName || undefined,
        customerEmail: emailAddress || undefined,
        shippingAddress: shippingAddress || undefined,
        itemsJson: activeCartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: (item as any).productTitle || (item as any).title || 'Product',
          unitPrice: item.price || (item as any).basePrice || 0,
          quantity: item.quantity,
          lineTotal: (item.price || (item as any).basePrice || 0) * item.quantity,
        })),
        totalAmount,
      })
        .unwrap()
        .catch(() => {
          // Silent — abandoned-cart tracking is analytics, not part of checkout.
        });
    }

    router.push(storeSlug ? `/store/${storeSlug}/checkout/review` : '/checkout/review');
  };

  return (
    <div
      className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans"
      style={{ ['--brand' as any]: primaryColor }}
    >

      {/* Full storefront navigation — same header as the rest of the store. */}
      <ShopEaseNavbar
        storeName={store?.name}
        slug={storeSlug || 'main'}
        logo={store?.logo}
        primaryColor={primaryColor}
        activeTab="shop"
      />
      <CartDrawer primaryColor={primaryColor} />

      {/* =======================================================================
          2. CHECKOUT HEADER (CLEAN TITLE)
      ======================================================================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-8 pb-6">
        <div className="pb-6 border-b border-slate-200/80">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Checkout
          </h1>
        </div>
      </div>

      {/* =======================================================================
          3. MAIN 2-COLUMN CHECKOUT CONTENT
      ======================================================================= */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 pb-16">
        <form onSubmit={handleReviewOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* -------------------------------------------------------------------
              LEFT MAIN COLUMN (SHIPPING & PAYMENT FORMS)
          ------------------------------------------------------------------- */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-8">
            
            {/* --- SECTION 1: SHIPPING INFORMATION --- */}
            <div>
              <h2 className="text-base font-extrabold text-slate-900 mb-5">
                Shipping Information
              </h2>

              <div className="space-y-4 text-xs font-semibold">
                
                {/* Row 1: Full Name & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="MD Belal Hossain"
                      className="w-full h-11 px-4 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:[border-color:var(--brand)] focus:ring-1 focus:[--tw-ring-color:var(--brand)] transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex h-11 border border-slate-200 rounded-xl overflow-hidden focus-within:[border-color:var(--brand)] focus-within:ring-1 focus-within:[--tw-ring-color:var(--brand)] bg-white">
                      <div className="flex items-center gap-1 px-3 bg-slate-50 border-r border-slate-200 text-slate-700 font-bold text-xs shrink-0 select-none">
                        <span>🇧🇩</span>
                        <span>{countryCode}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="1712-345678"
                        className="w-full px-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Email Address */}
                {showField('email') && (
                  <div>
                    <label className="block text-slate-700 mb-1.5">
                      Email Address {reqMark('email')}
                    </label>
                    <input
                      type="email"
                      required={isRequired('email')}
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="belal.hossain@example.com"
                      className="w-full h-11 px-4 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:[border-color:var(--brand)] focus:ring-1 focus:[--tw-ring-color:var(--brand)] transition-all bg-white"
                    />
                  </div>
                )}

                {/* Row 3: Address */}
                {showField('address') && (
                  <div>
                    <label className="block text-slate-700 mb-1.5">
                      Address {reqMark('address')}
                    </label>
                    <input
                      type="text"
                      required={isRequired('address')}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House 12, Road 5, Dhanmondi"
                      className="w-full h-11 px-4 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:[border-color:var(--brand)] focus:ring-1 focus:[--tw-ring-color:var(--brand)] transition-all bg-white"
                    />
                  </div>
                )}

                {/* Row 4: Location dropdowns (Country, Division, District, City/Area) */}
                {(showField('country') || showField('division') || showField('district') || showField('cityArea')) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {showField('country') && (
                      <div>
                        <label className="block text-slate-700 mb-1.5">
                          Country {reqMark('country')}
                        </label>
                        <div className="relative">
                          <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full h-11 pl-3 pr-8 border border-slate-200 rounded-xl text-slate-900 font-medium bg-white appearance-none focus:outline-none focus:[border-color:var(--brand)] focus:ring-1 focus:[--tw-ring-color:var(--brand)] text-xs"
                          >
                            <option value="Bangladesh">Bangladesh</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {showField('division') && (
                      <div>
                        <label className="block text-slate-700 mb-1.5">
                          Division {reqMark('division')}
                        </label>
                        <div className="relative">
                          <select
                            value={division}
                            onChange={(e) => setDivision(e.target.value)}
                            className="w-full h-11 pl-3 pr-8 border border-slate-200 rounded-xl text-slate-900 font-medium bg-white appearance-none focus:outline-none focus:[border-color:var(--brand)] focus:ring-1 focus:[--tw-ring-color:var(--brand)] text-xs"
                          >
                            <option value="Dhaka">Dhaka</option>
                            <option value="Chittagong">Chittagong</option>
                            <option value="Rajshahi">Rajshahi</option>
                            <option value="Sylhet">Sylhet</option>
                            <option value="Khulna">Khulna</option>
                            <option value="Barisal">Barisal</option>
                            <option value="Rangpur">Rangpur</option>
                            <option value="Mymensingh">Mymensingh</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {showField('district') && (
                      <div>
                        <label className="block text-slate-700 mb-1.5">
                          District {reqMark('district')}
                        </label>
                        <div className="relative">
                          <select
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full h-11 pl-3 pr-8 border border-slate-200 rounded-xl text-slate-900 font-medium bg-white appearance-none focus:outline-none focus:[border-color:var(--brand)] focus:ring-1 focus:[--tw-ring-color:var(--brand)] text-xs"
                          >
                            <option value="Dhaka">Dhaka</option>
                            <option value="Gazipur">Gazipur</option>
                            <option value="Narayanganj">Narayanganj</option>
                            <option value="Tangail">Tangail</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {showField('cityArea') && (
                      <div>
                        <label className="block text-slate-700 mb-1.5">
                          City/Area {reqMark('cityArea')}
                        </label>
                        <div className="relative">
                          <select
                            value={cityArea}
                            onChange={(e) => setCityArea(e.target.value)}
                            className="w-full h-11 pl-3 pr-8 border border-slate-200 rounded-xl text-slate-900 font-medium bg-white appearance-none focus:outline-none focus:[border-color:var(--brand)] focus:ring-1 focus:[--tw-ring-color:var(--brand)] text-xs"
                          >
                            <option value="Dhanmondi">Dhanmondi</option>
                            <option value="Gulshan">Gulshan</option>
                            <option value="Banani">Banani</option>
                            <option value="Uttara">Uttara</option>
                            <option value="Mirpur">Mirpur</option>
                            <option value="Mohammadpur">Mohammadpur</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Row 5: Zip Code & Order Note */}
                {(showField('zipCode') || showOrderNoteFieldAtCheckout) && (
                  <div
                    className={`grid grid-cols-1 ${
                      showField('zipCode') && showOrderNoteFieldAtCheckout ? 'sm:grid-cols-2' : ''
                    } gap-4`}
                  >
                    {showField('zipCode') && (
                      <div>
                        <label className="block text-slate-700 mb-1.5">
                          Zip Code {reqMark('zipCode')}
                        </label>
                        <input
                          type="text"
                          required={isRequired('zipCode')}
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder="1205"
                          className="w-full h-11 px-4 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:[border-color:var(--brand)] focus:ring-1 focus:[--tw-ring-color:var(--brand)] transition-all bg-white"
                        />
                      </div>
                    )}

                    {showOrderNoteFieldAtCheckout && (
                      <div>
                        <label className="block text-slate-700 mb-1.5">
                          Order Note {reqMark('orderNote')}
                        </label>
                        <input
                          type="text"
                          value={orderNote}
                          onChange={(e) => setOrderNote(e.target.value)}
                          placeholder="Note about your order, e.g. leave at door..."
                          className="w-full h-11 px-4 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:[border-color:var(--brand)] focus:ring-1 focus:[--tw-ring-color:var(--brand)] transition-all bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}

                {!guestCheckoutEnabled && !loggedInCustomer && !authUser && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-semibold leading-relaxed">
                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p>
                      This store requires an account to check out.{' '}
                      <button
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="font-bold underline"
                      >
                        Log in or create an account
                      </button>{' '}
                      to continue.
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* --- SECTION 2: DELIVERY ZONE --- */}
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 mb-3.5">
                Delivery Area
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Inside Dhaka */}
                <div
                  onClick={() => setShippingMethod('standard')}
                  className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                    shippingMethod === 'standard'
                      ? 'border-2 bg-[color-mix(in_srgb,var(--brand)_8%,white)] [border-color:var(--brand)]'
                      : 'border border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Custom Radio Button */}
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: primaryColor }}
                    >
                      {shippingMethod === 'standard' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />}
                    </div>

                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}1a`, color: primaryColor }}>
                      <Truck className="w-4.5 h-4.5" />
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">Inside Dhaka</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Delivered within 1-2 business days</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-900">৳{insideDhakaCharge}</span>
                </div>

                {/* Outside Dhaka */}
                <div
                  onClick={() => setShippingMethod('express')}
                  className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                    shippingMethod === 'express'
                      ? 'border-2 bg-[color-mix(in_srgb,var(--brand)_8%,white)] [border-color:var(--brand)]'
                      : 'border border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Custom Radio Button */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'express' ? '' : 'border-slate-300'}`}
                      style={shippingMethod === 'express' ? { borderColor: primaryColor } : undefined}
                    >
                      {shippingMethod === 'express' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />}
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Rocket className="w-4.5 h-4.5" />
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">Outside Dhaka</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Delivered within 3-5 business days</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-900">৳{outsideDhakaCharge}</span>
                </div>
              </div>
            </div>

            {/* --- SECTION 3: PAYMENT METHOD --- */}
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 mb-3.5">
                Payment Method
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-start gap-2.5 ${
                    paymentMethod === 'COD'
                      ? 'border-2 [border-color:var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,white)] shadow-2xs'
                      : 'border border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-900 leading-tight">Cash on Delivery</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">Pay when you receive</p>
                  </div>
                </div>

                {/* 2. bKash */}
                <div
                  onClick={() => setPaymentMethod('BKASH')}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-start gap-2.5 ${
                    paymentMethod === 'BKASH'
                      ? 'border-2 [border-color:var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,white)] shadow-2xs'
                      : 'border border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-[#e2136e]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 12l4 4 6-6 6 6 4-4L12 2zm0 8l-3 3 3 3 3-3-3-3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-900 leading-tight">bKash</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">Pay with bKash</p>
                  </div>
                </div>

                {/* 3. Nagad */}
                <div
                  onClick={() => setPaymentMethod('NAGAD')}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-start gap-2.5 ${
                    paymentMethod === 'NAGAD'
                      ? 'border-2 [border-color:var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,white)] shadow-2xs'
                      : 'border border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-4 h-4 rounded-full bg-[#f7941d] flex items-center justify-center text-[8px] text-white font-black">
                      N
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-900 leading-tight">Nagad</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">Pay with Nagad</p>
                  </div>
                </div>

                {/* 4. Card / Online */}
                <div
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-start gap-2.5 ${
                    paymentMethod === 'CARD'
                      ? 'border-2 [border-color:var(--brand)] bg-[color-mix(in_srgb,var(--brand)_8%,white)] shadow-2xs'
                      : 'border border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${primaryColor}1a`, color: primaryColor }}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-900 leading-tight">Card / Online</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">Visa, MasterCard, etc.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Policy Disclaimer */}
            <div className="flex items-start gap-2.5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-normal leading-relaxed">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p>
                Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{' '}
                <Link href={storeSlug ? `/store/${storeSlug}/privacy` : '/privacy'} className="font-bold underline [color:var(--brand)]">
                  privacy policy
                </Link>
                .
              </p>
            </div>

          </div>

          {/* -------------------------------------------------------------------
              RIGHT COLUMN (ORDER SUMMARY & REVIEW ORDER)
          ------------------------------------------------------------------- */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6 sticky top-24">
            
            {/* Summary Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">
                Order Summary
              </h2>
              <Link
                href={storeSlug ? `/store/${storeSlug}` : '/'}
                className="text-xs font-bold hover:brightness-110 flex items-center gap-1 [color:var(--brand)]"
              >
                <span>Edit Cart</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              {activeCartItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Product Thumbnail with Qty Badge */}
                    <div className="relative w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&q=80'}
                        alt={(item as any).productTitle || (item as any).title || 'Product'}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="min-w-0 max-w-[160px]">
                      <p className="text-xs font-bold text-slate-900 truncate leading-snug">
                        {(item as any).productTitle || (item as any).title || 'Product'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-slate-900 shrink-0">
                    ৳{Number(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Field */}
            {showCouponFieldAtCheckout && (
              <div className="pt-4 border-t border-slate-100">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{appliedCoupon.code} applied</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-slate-500 font-bold hover:text-slate-900"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Coupon Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter promo code"
                        className="flex-1 h-10 px-3 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 text-xs focus:outline-none focus:[border-color:var(--brand)] focus:ring-1 focus:[--tw-ring-color:var(--brand)] transition-all bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        className="h-10 px-4 rounded-xl text-white font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-red-500 font-semibold">{couponError}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Price Calculations */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs font-semibold">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({itemsCount} items)</span>
                <span className="text-slate-900">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Charge</span>
                <span className="text-slate-900">৳{shippingCharge}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span className="text-emerald-600 font-bold">-৳{discount}</span>
              </div>
            </div>

            {/* Minimum Order Amount Notice */}
            {isBelowMinimumOrder && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-[11px] font-bold text-red-600">
                Minimum order amount is ৳{minimumOrderAmount.toLocaleString()}. Add ৳{(minimumOrderAmount - subtotal).toLocaleString()} more to checkout.
              </div>
            )}

            {/* Total Amount Row */}
            <div className="pt-4 border-t border-slate-100 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-extrabold text-slate-900">Total Amount</span>
                <span className="text-2xl font-black text-slate-900">৳{totalAmount.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <p className="text-[11px] font-bold text-emerald-600">
                  You will save ৳{discount.toLocaleString()} on this order
                </p>
              )}
            </div>

            {/* Secure Checkout Notice Box */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 text-[11px] leading-tight">Secure Checkout</p>
                  <p className="text-[10px] text-slate-500 font-medium">Your payment information is 100% secure</p>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>

            {/* Dynamic Payment Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || isBelowMinimumOrder || blockedByGuestCheckout}
              className="w-full h-12 hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              {isBelowMinimumOrder ? (
                <span>Minimum order amount is ৳{minimumOrderAmount.toLocaleString()}</span>
              ) : blockedByGuestCheckout ? (
                <span>Log in to Checkout</span>
              ) : (
                <>
                  <span>Review Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Return to Cart */}
            <div className="text-center pt-1">
              <Link
                href={storeSlug ? `/store/${storeSlug}` : '/'}
                className="text-xs text-slate-500 font-bold hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Return to Cart</span>
              </Link>
            </div>

          </div>

        </form>
      </main>

      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        storeName={store?.name}
        storeSlug={storeSlug}
        primaryColor={primaryColor}
        initialMode="login"
      />

    </div>
  );
}
