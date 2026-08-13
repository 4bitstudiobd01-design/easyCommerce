import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const getStoredAuth = (): { user: User | null; token: string | null; refreshToken: string | null } => {
  if (typeof window === 'undefined') return { user: null, token: null, refreshToken: null };
  try {
    const token = localStorage.getItem('easycommerce_token');
    const refreshToken = localStorage.getItem('easycommerce_refresh_token');
    const userStr = localStorage.getItem('easycommerce_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return { user, token, refreshToken };
  } catch (e) {
    return { user: null, token: null, refreshToken: null };
  }
};

const storedAuth = getStoredAuth();

const initialState: AuthState = {
  user: storedAuth.user,
  token: storedAuth.token,
  refreshToken: storedAuth.refreshToken,
  isAuthenticated: Boolean(storedAuth.token && storedAuth.user),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken?: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('easycommerce_token', action.payload.token);
        localStorage.setItem('easycommerce_user', JSON.stringify(action.payload.user));
        if (action.payload.refreshToken) {
          localStorage.setItem('easycommerce_refresh_token', action.payload.refreshToken);
        }
        // The cookie only gates the Next.js route guard; it is deliberately kept in
        // step with the access token's own lifetime expectations via the refresh flow.
        document.cookie = `easycommerce_token=${action.payload.token}; path=/; max-age=604800; SameSite=Lax`;
      }
    },

    // Applied after a silent refresh: swaps the tokens without touching the user.
    setTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken?: string }>
    ) => {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('easycommerce_token', action.payload.token);
        if (action.payload.refreshToken) {
          localStorage.setItem('easycommerce_refresh_token', action.payload.refreshToken);
        }
        document.cookie = `easycommerce_token=${action.payload.token}; path=/; max-age=604800; SameSite=Lax`;
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('easycommerce_token');
        localStorage.removeItem('easycommerce_refresh_token');
        localStorage.removeItem('easycommerce_user');
        document.cookie = 'easycommerce_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      }
    },
  },
});

export const { setCredentials, setTokens, logout } = authSlice.actions;
export default authSlice.reducer;
