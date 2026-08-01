import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../api/catalogApi';

interface CatalogState {
  selectedProduct: Product | null;
}

const initialState: CatalogState = {
  selectedProduct: null,
};

export const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
  },
});

export const { setSelectedProduct } = catalogSlice.actions;
export default catalogSlice.reducer;
