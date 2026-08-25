import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CustomerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface CustomerAuthState {
  customer: CustomerUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

// Separate storage keys from the merchant dashboard's bitcommerce_* keys so a
// merchant testing their own storefront in the same browser doesn't collide
// sessions with a logged-in customer. ec_ prefix matches the existing
// ec_session_id / ec_attribution storefront convention.
const TOKEN_KEY = 'ec_customer_token';
const REFRESH_TOKEN_KEY = 'ec_customer_refresh_token';
const USER_KEY = 'ec_customer_user';

const getStoredAuth = (): { customer: CustomerUser | null; token: string | null; refreshToken: string | null } => {
  if (typeof window === 'undefined') return { customer: null, token: null, refreshToken: null };
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const customer = userStr ? JSON.parse(userStr) : null;
    return { customer, token, refreshToken };
  } catch {
    return { customer: null, token: null, refreshToken: null };
  }
};

const storedAuth = getStoredAuth();

const initialState: CustomerAuthState = {
  customer: storedAuth.customer,
  token: storedAuth.token,
  refreshToken: storedAuth.refreshToken,
  isAuthenticated: Boolean(storedAuth.token && storedAuth.customer),
};

export const customerAuthSlice = createSlice({
  name: 'customerAuth',
  initialState,
  reducers: {
    setCustomerCredentials: (
      state,
      action: PayloadAction<{ customer: CustomerUser; token: string; refreshToken?: string }>,
    ) => {
      state.customer = action.payload.customer;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.customer));
        if (action.payload.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, action.payload.refreshToken);
        }
        document.cookie = `${TOKEN_KEY}=${action.payload.token}; path=/; max-age=604800; SameSite=Lax`;
      }
    },

    setCustomerTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken?: string }>,
    ) => {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        if (action.payload.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, action.payload.refreshToken);
        }
        document.cookie = `${TOKEN_KEY}=${action.payload.token}; path=/; max-age=604800; SameSite=Lax`;
      }
    },

    updateCustomerProfile: (state, action: PayloadAction<CustomerUser>) => {
      state.customer = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
      }
    },

    customerLogout: (state) => {
      state.customer = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      }
    },
  },
});

export const { setCustomerCredentials, setCustomerTokens, updateCustomerProfile, customerLogout } = customerAuthSlice.actions;
export default customerAuthSlice.reducer;
