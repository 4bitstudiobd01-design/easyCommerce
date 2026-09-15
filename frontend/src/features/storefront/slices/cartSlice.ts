import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Minimal shape of a resolved ProductVariantEntity needed to add a specific
 * variant to the cart. Callers (product cards, PDP, detail modal) pass this
 * only when the customer actually selected a variant combination — omitting
 * it keeps today's product-level add-to-cart behavior fully unchanged.
 */
export interface CartVariantInput {
  id: string;
  title?: string;
  price?: number;
  sku?: string;
  options?: Array<{ attributeName: string; optionLabel: string }>;
  imageUrl?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  sku?: string;
  storeSlug: string;
  variantId?: string;
  /** Human-readable label for the selected variant, e.g. "Black / Large". */
  variantTitle?: string;
  /** attributeName -> optionLabel, e.g. { Color: 'Black', Size: 'Large' }. */
  selectedOptions?: Record<string, string>;
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

// Same cart line iff same product AND same variant (both undefined counts as a match).
const isSameLine = (item: CartItem, productId: string, variantId?: string) =>
  item.productId === productId && item.variantId === variantId;

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<{ product: any; quantity?: number; storeSlug: string; variant?: CartVariantInput }>,
    ) => {
      const { product, quantity = 1, storeSlug, variant } = action.payload;
      const primaryImg = product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url;

      // A cart can only contain items from one store at a time — adding from a
      // different store starts a fresh cart rather than mixing storeSlugs.
      if (state.items.length > 0 && state.items[0].storeSlug !== storeSlug) {
        state.items = [];
      }

      const existingIndex = state.items.findIndex((item) => isSameLine(item, product.id, variant?.id));

      if (existingIndex > -1) {
        state.items[existingIndex].quantity += quantity;
      } else {
        const selectedOptions = variant?.options?.reduce<Record<string, string>>((acc, opt) => {
          acc[opt.attributeName] = opt.optionLabel;
          return acc;
        }, {});

        state.items.push({
          id: variant ? `cart-${product.id}-${variant.id}` : `cart-${product.id}`,
          productId: product.id,
          title: product.title,
          price: variant ? Number(variant.price ?? product.basePrice) : Number(product.basePrice),
          imageUrl: variant ? variant.imageUrl ?? primaryImg : primaryImg,
          quantity,
          sku: variant ? variant.sku ?? product.variants?.[0]?.sku : product.variants?.[0]?.sku,
          storeSlug,
          variantId: variant?.id,
          variantTitle: variant?.title,
          selectedOptions: selectedOptions && Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
        });
      }

      state.isDrawerOpen = true;

      if (typeof window !== 'undefined') {
        localStorage.setItem('bitcommerce_cart', JSON.stringify(state.items));
      }
    },

    removeFromCart: (state, action: PayloadAction<string | { productId: string; variantId?: string }>) => {
      const target = typeof action.payload === 'string' ? { productId: action.payload, variantId: undefined } : action.payload;
      state.items = state.items.filter((item) => !isSameLine(item, target.productId, target.variantId));
      if (typeof window !== 'undefined') {
        localStorage.setItem('bitcommerce_cart', JSON.stringify(state.items));
      }
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number; variantId?: string }>,
    ) => {
      const { productId, quantity, variantId } = action.payload;
      const item = state.items.find((i) => isSameLine(i, productId, variantId));
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => !isSameLine(i, productId, variantId));
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
