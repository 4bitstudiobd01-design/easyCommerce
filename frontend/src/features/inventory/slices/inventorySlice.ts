import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventoryStock } from '../api/inventoryApi';

interface InventoryState {
  selectedStock: InventoryStock | null;
}

const initialState: InventoryState = {
  selectedStock: null,
};

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setSelectedStock: (state, action: PayloadAction<InventoryStock | null>) => {
      state.selectedStock = action.payload;
    },
  },
});

export const { setSelectedStock } = inventorySlice.actions;
export default inventorySlice.reducer;
