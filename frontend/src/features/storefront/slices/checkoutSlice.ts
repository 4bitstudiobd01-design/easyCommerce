import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * The shipping/payment form the customer fills on the checkout page. It is saved
 * here (and mirrored to localStorage) when they press "Review Order" so the
 * separate /checkout/review route can render the full order preview and place
 * the order — without the form losing its values across the navigation or a
 * page reload.
 */
export interface CheckoutDraft {
  storeSlug: string;
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  emailAddress: string;
  address: string;
  country: string;
  division: string;
  district: string;
  cityArea: string;
  zipCode: string;
  orderNote: string;
  /** 'standard' = inside Dhaka, 'express' = outside Dhaka. */
  shippingMethod: 'standard' | 'express';
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'CARD';
  appliedCoupon: { code: string; discountAmount: number } | null;
}

interface CheckoutState {
  draft: CheckoutDraft | null;
}

const STORAGE_KEY = 'bitcommerce_checkout_draft';

const getStoredDraft = (): CheckoutDraft | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CheckoutDraft) : null;
  } catch {
    return null;
  }
};

const persist = (draft: CheckoutDraft | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (draft) localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — the in-memory draft still works for this navigation */
  }
};

const initialState: CheckoutState = {
  draft: getStoredDraft(),
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setCheckoutDraft: (state, action: PayloadAction<CheckoutDraft>) => {
      state.draft = action.payload;
      persist(action.payload);
    },
    clearCheckoutDraft: (state) => {
      state.draft = null;
      persist(null);
    },
  },
});

export const { setCheckoutDraft, clearCheckoutDraft } = checkoutSlice.actions;
export default checkoutSlice.reducer;
