import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Store } from '../api/tenantApi';

interface TenantState {
  currentStore: Store | null;
}

const initialState: TenantState = {
  currentStore: null,
};

export const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setStore: (state, action: PayloadAction<Store | null>) => {
      state.currentStore = action.payload;
    },
  },
});

export const { setStore } = tenantSlice.actions;
export default tenantSlice.reducer;
