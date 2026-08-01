import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order } from '../api/orderApi';

interface OrderState {
  selectedOrder: Order | null;
}

const initialState: OrderState = {
  selectedOrder: null,
};

export const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setSelectedOrder: (state, action: PayloadAction<Order | null>) => {
      state.selectedOrder = action.payload;
    },
  },
});

export const { setSelectedOrder } = orderSlice.actions;
export default orderSlice.reducer;
