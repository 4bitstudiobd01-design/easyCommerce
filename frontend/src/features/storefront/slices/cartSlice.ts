import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  sku?: string;
  storeSlug: string;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
}

const getStoredCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const itemStr = localStorage.getItem('bitcommerce_cart');
    return itemStr ? JSON.parse(itemStr) : [];
  } catch (e) {
    return [];
  }
};

const initialState: CartState = {
  items: getStoredCart(),
  isDrawerOpen: false,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ product: any; quantity?: number; storeSlug: string }>) => {
      const { product, quantity = 1, storeSlug } = action.payload;
      const primaryImg = product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url;

      // A cart can only contain items from one store at a time — adding from a
      // different store starts a fresh cart rather than mixing storeSlugs.
      if (state.items.length > 0 && state.items[0].storeSlug !== storeSlug) {
        state.items = [];
      }

      const existingIndex = state.items.findIndex((item) => item.productId === product.id);

      if (existingIndex > -1) {
        state.items[existingIndex].quantity += quantity;
      } else {
        state.items.push({
          id: `cart-${product.id}`,
          productId: product.id,
          title: product.title,
          price: Number(product.basePrice),
          imageUrl: primaryImg,
          quantity,
          sku: product.variants?.[0]?.sku,
          storeSlug,
        });
      }

      state.isDrawerOpen = true;

      if (typeof window !== 'undefined') {
        localStorage.setItem('bitcommerce_cart', JSON.stringify(state.items));
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bitcommerce_cart', JSON.stringify(state.items));
      }
    },

    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.productId === productId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i.productId !== productId);
        } else {
          item.quantity = quantity;
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('bitcommerce_cart', JSON.stringify(state.items));
      }
    },

    clearCart: (state) => {
      state.items = [];
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bitcommerce_cart');
      }
    },

    toggleCartDrawer: (state, action: PayloadAction<boolean | undefined>) => {
      state.isDrawerOpen = action.payload !== undefined ? action.payload : !state.isDrawerOpen;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCartDrawer,
} = cartSlice.actions;

export default cartSlice.reducer;
