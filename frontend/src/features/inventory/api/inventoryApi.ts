import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import { RootState } from '@/store';

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  city?: string;
  isDefault: boolean;
  tenantId: string;
}

export interface InventoryStock {
  id: string;
  warehouseId: string;
  warehouse?: Warehouse;
  warehouseName?: string;
  productId: string;
  productTitle?: string;
  sku?: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity?: number;
  isOutOfStock?: boolean;
  isLowStock?: boolean;
  reorderPoint: number;
  tenantId: string;
}

export interface InventoryStockItem {
  id: string;
  warehouseId: string;
  warehouse?: Warehouse;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity?: number;
  reorderPoint: number;
  tenantId: string;
}

export interface StockTransfer {
  id: string;
  fromWarehouseId: string;
  fromWarehouse?: Warehouse;
  toWarehouseId: string;
  toWarehouse?: Warehouse;
  productId: string;
  quantity: number;
  notes?: string;
  tenantId: string;
  createdAt: string;
}

export interface CreateStockTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: number;
  notes?: string;
}

export interface AdjustStockRequest {
  warehouseId?: string;
  productId: string;
  adjustmentType?: 'ADD' | 'SUBTRACT' | 'SET' | 'REMOVE';
  action?: 'ADD' | 'SUBTRACT' | 'SET' | 'REMOVE';
  quantity: number;
  notes?: string;
}

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: createBaseQueryWithReauth(process.env.NEXT_PUBLIC_API_URL?.replace('/orders', '') || 'http://localhost:5001/api/v1'),
  tagTypes: ['Warehouse', 'Stock', 'StockTransfer'],
  endpoints: (builder) => ({
    getWarehouses: builder.query<Warehouse[], void>({
      query: () => '/inventory/warehouses',
      providesTags: ['Warehouse'],
      transformResponse: (response: { data: Warehouse[] } | Warehouse[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    getInventoryStocks: builder.query<InventoryStock[], void>({
      query: () => '/inventory/stock',
      providesTags: ['Stock'],
      transformResponse: (response: { data: InventoryStock[] } | InventoryStock[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    getInventoryStock: builder.query<InventoryStockItem[], void>({
      query: () => '/inventory/stock',
      providesTags: ['Stock'],
      transformResponse: (response: { data: InventoryStockItem[] } | InventoryStockItem[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    adjustStock: builder.mutation<InventoryStock, AdjustStockRequest>({
      query: (body) => ({
        url: '/inventory/stock/adjust',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stock'],
      transformResponse: (response: { data: InventoryStock } | InventoryStock) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),
    createStockTransfer: builder.mutation<StockTransfer, CreateStockTransferRequest>({
      query: (body) => ({
        url: '/inventory/transfers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stock', 'StockTransfer'],
      transformResponse: (response: { data: StockTransfer } | StockTransfer) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),
    getStockTransfers: builder.query<StockTransfer[], void>({
      query: () => '/inventory/transfers',
      providesTags: ['StockTransfer'],
      transformResponse: (response: { data: StockTransfer[] } | StockTransfer[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
  }),
});

export const {
  useGetWarehousesQuery,
  useGetInventoryStocksQuery,
  useGetInventoryStockQuery,
  useAdjustStockMutation,
  useCreateStockTransferMutation,
  useGetStockTransfersQuery,
} = inventoryApi;
