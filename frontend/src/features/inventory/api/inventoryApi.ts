import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import { RootState } from '@/store';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  phone?: string;
  isDefault: boolean;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWarehouseRequest {
  name: string;
  code: string;
  isDefault?: boolean;
  address?: string;
  phone?: string;
}

export interface UpdateWarehouseRequest {
  id: string;
  name?: string;
  code?: string;
  isDefault?: boolean;
  address?: string;
  phone?: string;
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
  variantId?: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity?: number;
  reorderPoint: number;
  tenantId: string;
}

export interface StockTransfer {
  id: string;
  fromWarehouseId?: string;
  fromWarehouse?: Warehouse;
  fromBranchId?: string;
  toWarehouseId?: string;
  toWarehouse?: Warehouse;
  toBranchId?: string;
  productId: string;
  variantId?: string;
  variant?: { id: string; name?: string; sku?: string };
  quantity: number;
  notes?: string;
  createdByUserId?: string;
  createdByName?: string;
  createdByEmail?: string;
  tenantId: string;
  createdAt: string;
}

export interface StockTransferListResponse {
  data: StockTransfer[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ListStockTransfersParams {
  page?: number;
  limit?: number;
  search?: string;
  warehouseId?: string;
  branchId?: string;
}

export interface CreateStockTransferRequest {
  fromWarehouseId?: string;
  fromBranchId?: string;
  toWarehouseId?: string;
  toBranchId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
}

export interface BranchStockItem {
  id: string;
  branchId: string;
  productId: string;
  product?: { id: string; name?: string; title?: string };
  variantId?: string;
  variant?: { id: string; name?: string; sku?: string };
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity?: number;
  reorderPoint: number;
  tenantId: string;
}

export interface AdjustStockRequest {
  inventoryId?: string;
  productId?: string;
  variantId?: string;
  warehouseId?: string;
  action: 'ADD' | 'SET' | 'REMOVE';
  quantity: number;
  reason?: string;
  reference?: string;
  notes?: string;
}


export interface StockAdjustmentResponse {
  id: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  before: {
    onHand: number;
    reserved: number;
    available: number;
  };
  after: {
    onHand: number;
    reserved: number;
    available: number;
  };
  delta: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED';
  movement: {
    id: string;
    type: string;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    reason: string;
    referenceId?: string;
    note?: string;
    createdBy?: string;
    createdAt: string;
  };
}


export interface InventoryListItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productThumbnail?: string;
  categoryName?: string;
  productType: string;
  variantId?: string;
  variantTitle?: string;
  sku?: string;
  warehouseId?: string;
  warehouseName?: string;
  branchId?: string;
  branchName?: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED';
  updatedAt: string;
}

export interface InventoryListPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InventoryListResponse {
  data: InventoryListItem[];
  meta: InventoryListPaginationMeta;
}

export interface InventoryKpiResponse {
  totalItems: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  inStockCount: number;
}

export interface ListInventoryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  productType?: string;
  warehouseId?: string;
  branchId?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface InventoryDetailsResponse {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    thumbnail?: string;
    sku?: string;
    productType: string;
    trackInventory: boolean;
    allowBackorder: boolean;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  variant?: {
    id: string;
    title: string;
    sku?: string;
    price?: number;
    combinationKey?: string;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    isDefault: boolean;
  };
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED';
  createdAt: string;
  updatedAt: string;
}

export interface InventoryHistoryItem {
  id: string;
  inventoryStockId?: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    thumbnail?: string;
    sku?: string;
  };
  variant?: {
    id: string;
    title: string;
    sku?: string;
  };
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'INITIAL_STOCK' | 'RESERVED' | 'RELEASED' | 'RETURNED' | 'TRANSFER';
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  note?: string;
  performedBy?: string;
  createdAt: string;
}

export interface InventoryHistoryResponse {
  data: InventoryHistoryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListInventoryHistoryParams {
  page?: number;
  limit?: number;
  type?: string;
  reason?: string;
  performedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  inventoryId?: string;
  productId?: string;
  variantId?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProductVariantInventoryItem {
  inventoryStockId?: string;
  variantId: string;
  variantTitle: string;
  sku?: string;
  imageUrl?: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  lowStockThreshold: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED';
  warehouseName?: string;
  warehouseId?: string;
  isInitialized: boolean;
  updatedAt?: string;
}

export interface ProductVariantInventorySummary {
  totalVariants: number;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  lowStockVariants: number;
  outOfStockVariants: number;
  inStockVariants: number;
}

export interface ProductVariantInventoryResponse {
  product: {
    id: string;
    name: string;
    slug: string;
    sku?: string;
    categoryName?: string;
    thumbnail?: string;
    trackInventory: boolean;
    hasVariants: boolean;
  };
  summary: ProductVariantInventorySummary;
  data: ProductVariantInventoryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListProductVariantInventoryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface BulkAdjustStockRequest {
  inventoryIds: string[];
  action: 'ADD' | 'REMOVE' | 'SET';
  quantity: number;
  reason?: string;
  note?: string;
  referenceId?: string;
}

export interface BulkAdjustStockItemResult {
  inventoryId: string;
  productId: string;
  variantId?: string;
  previousQuantity: number;
  quantityDelta: number;
  newQuantity: number;
  availableQuantity: number;
  status: string;
  movementId: string;
}

export interface BulkAdjustStockResponse {
  success: boolean;
  affectedCount: number;
  movementCount: number;
  items: BulkAdjustStockItemResult[];
}

export interface InventoryDataOverview {
  totalProducts: number;
  totalVariants: number;
  totalInventoryItems: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalMovements: number;
}

export interface InventoryDataIntegrityViolation {
  inventoryId: string;
  type: string;
  message: string;
}

export interface InventoryDataIntegrity {
  status: 'HEALTHY' | 'DEGRADED';
  violationCount: number;
  violations: InventoryDataIntegrityViolation[];
}

export interface InventorySecurityGuarantees {
  stockValidationEnabled: boolean;
  auditLogEnabled: boolean;
  tenantIsolationEnabled: boolean;
  autoStatusUpdateEnabled: boolean;
  bulkOperationsEnabled: boolean;
}

export interface InventorySettingsOverviewResponse {
  overview: InventoryDataOverview;
  integrity: InventoryDataIntegrity;
  securityGuarantees: InventorySecurityGuarantees;
}

export interface SeedInventoryDemoDataResponse {
  success: boolean;
  message: string;
  productsCreated: number;
  variantsCreated: number;
  inventoryStocksCreated: number;
  movementsCreated: number;
}

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: createBaseQueryWithReauth(process.env.NEXT_PUBLIC_API_URL?.replace('/orders', '') || 'http://localhost:5001/api/v1'),
  tagTypes: [
    'Warehouse',
    'Stock',
    'StockTransfer',
    'InventoryList',
    'InventoryKpis',
    'InventoryHistory',
    'ProductVariantInventory',
    'InventorySettings',
  ],



  endpoints: (builder) => ({
    getInventoryList: builder.query<InventoryListResponse, ListInventoryParams | void>({
      query: (params) => ({
        url: '/inventory',
        params: params || {},
      }),
      providesTags: ['InventoryList'],
      transformResponse: (response: any): InventoryListResponse => {
        const payload = response?.data ?? response;
        const data = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(response?.data)
          ? response.data
          : [];
        const meta = payload?.meta ?? response?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };
        return {
          data,
          meta,
        };
      },
    }),
    getInventoryDetails: builder.query<InventoryDetailsResponse, string>({
      query: (id) => `/inventory/${id}`,
      providesTags: (result, error, id) => [{ type: 'Stock', id }],
      transformResponse: (response: { data: InventoryDetailsResponse } | InventoryDetailsResponse) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),
    getInventoryKpis: builder.query<InventoryKpiResponse, void>({
      query: () => '/inventory/kpis',
      providesTags: ['InventoryKpis'],
      transformResponse: (response: { data: InventoryKpiResponse } | InventoryKpiResponse) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),
    getWarehouses: builder.query<Warehouse[], void>({
      query: () => '/inventory/warehouses',
      providesTags: ['Warehouse'],
      transformResponse: (response: { data: Warehouse[] } | Warehouse[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    createWarehouse: builder.mutation<Warehouse, CreateWarehouseRequest>({
      query: (body) => ({
        url: '/inventory/warehouses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Warehouse'],
      transformResponse: (response: { data: Warehouse } | Warehouse) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),
    updateWarehouse: builder.mutation<Warehouse, UpdateWarehouseRequest>({
      query: ({ id, ...body }) => ({
        url: `/inventory/warehouses/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Warehouse'],
      transformResponse: (response: { data: Warehouse } | Warehouse) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),
    deleteWarehouse: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/inventory/warehouses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Warehouse'],
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
    adjustStock: builder.mutation<StockAdjustmentResponse, AdjustStockRequest>({
      query: (body) => ({
        url: body.inventoryId ? `/inventory/${body.inventoryId}/adjust` : '/inventory/adjust',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { inventoryId }) => [
        'Stock',
        'InventoryList',
        'InventoryKpis',
        'InventoryHistory',
        'ProductVariantInventory',
        ...(inventoryId ? [{ type: 'Stock' as const, id: inventoryId }] : []),
      ],
      transformResponse: (response: { data: StockAdjustmentResponse } | StockAdjustmentResponse) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),
    getInventoryHistory: builder.query<
      InventoryHistoryResponse,
      { inventoryId?: string; params?: ListInventoryHistoryParams } | void
    >({
      query: (arg) => {
        const inventoryId = typeof arg === 'object' && arg !== null ? arg.inventoryId : undefined;
        const params = typeof arg === 'object' && arg !== null ? arg.params : {};
        return {
          url: inventoryId ? `/inventory/${inventoryId}/history` : '/inventory/history',
          params: params || {},
        };
      },
      providesTags: ['InventoryHistory'],
      transformResponse: (response: any): InventoryHistoryResponse => {
        const payload = response?.data ?? response;
        const data = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(response?.data)
          ? response.data
          : [];
        const meta = payload?.meta ?? response?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };
        return {
          data,
          meta,
        };
      },
    }),


    getProductVariantInventory: builder.query<
      ProductVariantInventoryResponse,
      { productId: string; params?: ListProductVariantInventoryParams }
    >({
      query: ({ productId, params }) => ({
        url: `/inventory/product/${productId}`,
        params: params || {},
      }),
      providesTags: ['ProductVariantInventory'],
      transformResponse: (response: { data: ProductVariantInventoryResponse } | ProductVariantInventoryResponse) =>
        ('data' in (response as any) && 'summary' in (response as any))
          ? (response as ProductVariantInventoryResponse)
          : (response as any)?.data || response,
    }),

    bulkAdjustStock: builder.mutation<BulkAdjustStockResponse, BulkAdjustStockRequest>({
      query: (body) => ({
        url: '/inventory/bulk-adjust',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Stock',
        'InventoryList',
        'InventoryKpis',
        'InventoryHistory',
        'ProductVariantInventory',
      ],
      transformResponse: (response: { data: BulkAdjustStockResponse } | BulkAdjustStockResponse) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),

    getInventorySettingsOverview: builder.query<InventorySettingsOverviewResponse, void>({
      query: () => '/inventory/settings/overview',
      providesTags: ['InventorySettings', 'Stock', 'InventoryList', 'InventoryKpis'],
      transformResponse: (response: { data: InventorySettingsOverviewResponse } | InventorySettingsOverviewResponse) =>
        ('data' in (response as any) && 'overview' in (response as any))
          ? (response as InventorySettingsOverviewResponse)
          : (response as any)?.data || response,
    }),

    seedInventoryDemoData: builder.mutation<SeedInventoryDemoDataResponse, void>({
      query: () => ({
        url: '/inventory/settings/seed-demo-data',
        method: 'POST',
      }),
      invalidatesTags: [
        'Stock',
        'InventoryList',
        'InventoryKpis',
        'InventoryHistory',
        'ProductVariantInventory',
        'InventorySettings',
      ],
      transformResponse: (response: { data: SeedInventoryDemoDataResponse } | SeedInventoryDemoDataResponse) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),

    createStockTransfer: builder.mutation<StockTransfer, CreateStockTransferRequest>({
      query: (body) => ({
        url: '/inventory/transfers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stock', 'StockTransfer', 'InventoryList', 'InventoryKpis', 'InventoryHistory', 'ProductVariantInventory', 'InventorySettings'],
      transformResponse: (response: { data: StockTransfer } | StockTransfer) =>
        ('data' in (response as any)) ? (response as any).data : response,
    }),
    getStockTransfers: builder.query<StockTransferListResponse, ListStockTransfersParams | void>({
      query: (params) => ({ url: '/inventory/transfers', params: params || {} }),
      providesTags: ['StockTransfer'],
      transformResponse: (response: { data: StockTransferListResponse }) => response.data,
    }),
    getBranchStock: builder.query<BranchStockItem[], string>({
      query: (branchId) => `/inventory/transfers/branches/${branchId}/stock`,
      providesTags: ['Stock'],
      transformResponse: (response: { data: BranchStockItem[] } | BranchStockItem[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
    getAllBranchesStock: builder.query<BranchStockItem[], void>({
      query: () => '/inventory/transfers/branches/stock',
      providesTags: ['Stock'],
      transformResponse: (response: { data: BranchStockItem[] } | BranchStockItem[]) =>
        Array.isArray(response) ? response : (response as any).data || [],
    }),
  }),
});

export const {
  useGetInventoryListQuery,
  useGetInventoryDetailsQuery,
  useGetInventoryHistoryQuery,
  useGetProductVariantInventoryQuery,
  useGetInventorySettingsOverviewQuery,
  useSeedInventoryDemoDataMutation,
  useGetInventoryKpisQuery,
  useGetWarehousesQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
  useGetInventoryStocksQuery,
  useGetInventoryStockQuery,
  useAdjustStockMutation,
  useBulkAdjustStockMutation,
  useCreateStockTransferMutation,
  useGetStockTransfersQuery,
  useGetBranchStockQuery,
  useGetAllBranchesStockQuery,
} = inventoryApi;






