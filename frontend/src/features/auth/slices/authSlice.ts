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
  isAuthenticated: boolean;
}

const getStoredAuth = (): { user: User | null; token: string | null } => {
  if (typeof window === 'undefined') return { user: null, token: null };
  try {
    const token = localStorage.getItem('easycommerce_token');
    const userStr = localStorage.getItem('easycommerce_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return { user, token };
  } catch (e) {
    return { user: null, token: null };
  }
};

const storedAuth = getStoredAuth();

const initialState: AuthState = {
  user: storedAuth.user,
  token: storedAuth.token,
  isAuthenticated: Boolean(storedAuth.token && storedAuth.user),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('easycommerce_token', action.payload.token);
        localStorage.setItem('easycommerce_user', JSON.stringify(action.payload.user));
        document.cookie = `easycommerce_token=${action.payload.token}; path=/; max-age=604800; SameSite=Lax`;
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('easycommerce_token');
        localStorage.removeItem('easycommerce_user');
        document.cookie = 'easycommerce_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
