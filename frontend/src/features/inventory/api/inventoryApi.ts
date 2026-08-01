import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  address?: string;
  phone?: string;
}

export interface InventoryStock {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  sku: string;
  categoryName?: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  reorderPoint: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export interface AdjustStockRequest {
  productId: string;
  warehouseId?: string;
  quantity: number;
  action: 'ADD' | 'SET' | 'REMOVE';
}

export interface CreateWarehouseRequest {
  name: string;
  code: string;
  address?: string;
  phone?: string;
}

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/inventory',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || localStorage.getItem('easycommerce_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Inventory', 'Warehouse'],
  endpoints: (builder) => ({
    getInventoryStocks: builder.query<InventoryStock[], void>({
      query: () => '/stocks',
      providesTags: ['Inventory'],
      transformResponse: (response: { data: InventoryStock[] }) => response.data,
    }),
    getWarehouses: builder.query<Warehouse[], void>({
      query: () => '/warehouses',
      providesTags: ['Warehouse'],
      transformResponse: (response: { data: Warehouse[] }) => response.data,
    }),
    adjustStock: builder.mutation<any, AdjustStockRequest>({
      query: (stockData) => ({
        url: '/adjust',
        method: 'POST',
        body: stockData,
      }),
      invalidatesTags: ['Inventory'],
      transformResponse: (response: { data: any }) => response.data,
    }),
    createWarehouse: builder.mutation<Warehouse, CreateWarehouseRequest>({
      query: (warehouseData) => ({
        url: '/warehouses',
        method: 'POST',
        body: warehouseData,
      }),
      invalidatesTags: ['Warehouse'],
      transformResponse: (response: { data: Warehouse }) => response.data,
    }),
  }),
});

export const {
  useGetInventoryStocksQuery,
  useGetWarehousesQuery,
  useAdjustStockMutation,
  useCreateWarehouseMutation,
} = inventoryApi;
