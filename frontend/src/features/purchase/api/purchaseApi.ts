import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

// ─── Enums ──────────────────────────────────────────────────────────────────
export type SupplierStatus = 'ACTIVE' | 'INACTIVE';
export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_RECEIVED'
  | 'FULLY_RECEIVED'
  | 'CANCELLED';
export type BillPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type BillStatus = 'OPEN' | 'CANCELLED';
export type SupplierPaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'CHEQUE'
  | 'MOBILE_BANKING';

// ─── Suppliers ──────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  location?: string;
  status: SupplierStatus;
  openingBalance: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListItem extends Supplier {
  totalPurchases: string;
  outstandingDue: string;
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  monthPurchases: string;
  outstandingDue: string;
  overdueAmount: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  location?: string;
  status?: SupplierStatus;
  openingBalance?: number;
  notes?: string;
}

export type UpdateSupplierRequest = { id: string } & Partial<CreateSupplierRequest>;

export interface ListSuppliersParams {
  search?: string;
  status?: SupplierStatus;
  sort?: 'name_asc' | 'name_desc' | 'purchases_desc' | 'due_desc';
  page?: number;
  limit?: number;
}

// ─── Purchase orders ────────────────────────────────────────────────────────
export interface PurchaseOrderLine {
  id: string;
  storeId: string;
  purchaseOrderId: string;
  productId: string;
  variantId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: string;
  lineTotal: string;
  lineOrder: number;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  storeId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate?: string;
  status: PurchaseOrderStatus;
  subtotal: string;
  totalAmount: string;
  receivedValue: string;
  notes?: string;
  billId?: string;
  createdAt: string;
  updatedAt: string;
  lines: PurchaseOrderLine[];
}

export type PurchaseOrderListItem = Omit<PurchaseOrder, 'lines'> & {
  receivedPct: string;
};

export interface PurchaseOrderStatBucket {
  count: number;
  amount: string;
}

export interface PurchaseOrderStats {
  draft: PurchaseOrderStatBucket;
  sent: PurchaseOrderStatBucket;
  partiallyReceived: PurchaseOrderStatBucket;
  fullyReceived: PurchaseOrderStatBucket;
  total: PurchaseOrderStatBucket;
}

export interface PurchaseOrderLineInput {
  productId: string;
  variantId?: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  orderDate: string;
  expectedDate?: string;
  status?: 'DRAFT' | 'SENT';
  notes?: string;
  lines: PurchaseOrderLineInput[];
}

export type UpdatePurchaseOrderRequest = { id: string } & Partial<
  Omit<CreatePurchaseOrderRequest, 'lines'>
> & { lines?: PurchaseOrderLineInput[] };

export interface ReceivePurchaseOrderRequest {
  id: string;
  lines: { lineId: string; receivedQuantity: number }[];
  receivedDate?: string;
  warehouseId?: string;
  notes?: string;
}

export interface ListPurchaseOrdersParams {
  search?: string;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

// ─── Bills (Purchases) ──────────────────────────────────────────────────────
export interface BillLine {
  id: string;
  storeId: string;
  billId: string;
  productId: string;
  variantId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitCost: string;
  lineTotal: string;
  lineOrder: number;
}

export interface Bill {
  id: string;
  tenantId: string;
  storeId: string;
  billNumber: string;
  supplierInvoiceNo?: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId?: string;
  billDate: string;
  dueDate?: string;
  subtotal: string;
  totalAmount: string;
  paidAmount: string;
  itemsCount: number;
  paymentStatus: BillPaymentStatus;
  status: BillStatus;
  journalEntryId?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lines: BillLine[];
}

export type BillListItem = Omit<Bill, 'lines'> & { dueAmount: string };

export interface BillStatDelta {
  value: string;
  momPct: string;
}

export interface BillStats {
  totalPurchases: BillStatDelta;
  totalItemsReceived: BillStatDelta;
  totalPaid: BillStatDelta;
  outstandingDue: BillStatDelta;
}

export interface BillLineInput {
  productId: string;
  variantId?: string;
  quantity: number;
  unitCost: number;
}

export interface CreateBillRequest {
  supplierId: string;
  purchaseOrderId?: string;
  supplierInvoiceNo?: string;
  billDate: string;
  dueDate?: string;
  paidAmount?: number;
  paymentMethod?: SupplierPaymentMethod;
  paidFromAccountId?: string;
  notes?: string;
  lines: BillLineInput[];
}

export interface UpdateBillRequest {
  id: string;
  supplierInvoiceNo?: string;
  dueDate?: string;
  notes?: string;
}

export interface ListBillsParams {
  search?: string;
  status?: BillPaymentStatus;
  supplierId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

// ─── Supplier payments ──────────────────────────────────────────────────────
export interface SupplierPayment {
  id: string;
  tenantId: string;
  storeId: string;
  paymentNumber: string;
  supplierId: string;
  supplierName: string;
  billId?: string;
  paymentDate: string;
  amount: string;
  method: SupplierPaymentMethod;
  paidFromAccountId?: string | null;
  reference?: string;
  journalEntryId?: string | null;
  notes?: string;
  createdAt: string;
}

export interface RecordSupplierPaymentRequest {
  supplierId: string;
  billId?: string;
  paymentDate: string;
  amount: number;
  method?: SupplierPaymentMethod;
  paidFromAccountId?: string;
  reference?: string;
  notes?: string;
}

export interface ListSupplierPaymentsParams {
  billId?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
}

// ─── Overview ───────────────────────────────────────────────────────────────
export interface PurchaseOverview {
  period: { from: string; to: string };
  kpis: {
    totalPurchases: BillStatDelta;
    receivedPurchases: BillStatDelta;
    pendingPurchaseOrders: { value: number; momPct: string };
    outstandingSupplierDue: BillStatDelta;
  };
  monthlyTrend: Array<{ month: string; amount: string; count: number }>;
  poStatusBreakdown: Array<{
    status: PurchaseOrderStatus;
    count: number;
    pct: string;
  }>;
  recentPurchases: Array<{
    id: string;
    purchaseNo: string;
    supplier: string;
    date: string;
    items: number;
    total: string;
    paid: string;
    due: string;
    status: BillPaymentStatus;
  }>;
  topSuppliers: Array<{
    id: string;
    name: string;
    totalPurchase: string;
    due: string;
  }>;
}

export interface PurchaseOverviewParams {
  from?: string;
  to?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Backend envelopes successful responses as `{ data: T }`; unwrap it here. */
const unwrap = <T,>(response: { data: T } | T): T =>
  (response as { data: T })?.data !== undefined
    ? (response as { data: T }).data
    : (response as T);

export const purchaseApi = createApi({
  reducerPath: 'purchaseApi',
  baseQuery: createBaseQueryWithReauth(
    process.env.NEXT_PUBLIC_API_URL?.replace('/orders', '') ||
      'http://localhost:5001/api/v1',
  ),
  tagTypes: [
    'Supplier',
    'PurchaseOrder',
    'Purchase',
    'SupplierPayment',
    'PurchaseOverview',
  ],
  endpoints: (builder) => ({
    // ── Overview ──
    getPurchaseOverview: builder.query<PurchaseOverview, PurchaseOverviewParams | void>({
      query: (params) => ({ url: '/purchase/overview', params: params || undefined }),
      providesTags: ['PurchaseOverview'],
      transformResponse: unwrap<PurchaseOverview>,
    }),

    // ── Suppliers ──
    getSuppliers: builder.query<Paginated<SupplierListItem>, ListSuppliersParams | void>({
      query: (params) => ({ url: '/purchase/suppliers', params: params || undefined }),
      providesTags: ['Supplier'],
      transformResponse: unwrap<Paginated<SupplierListItem>>,
    }),
    getSupplierStats: builder.query<SupplierStats, void>({
      query: () => '/purchase/suppliers/stats',
      providesTags: ['Supplier'],
      transformResponse: unwrap<SupplierStats>,
    }),
    createSupplier: builder.mutation<Supplier, CreateSupplierRequest>({
      query: (body) => ({ url: '/purchase/suppliers', method: 'POST', body }),
      invalidatesTags: ['Supplier', 'PurchaseOverview'],
      transformResponse: unwrap<Supplier>,
    }),
    updateSupplier: builder.mutation<Supplier, UpdateSupplierRequest>({
      query: ({ id, ...patch }) => ({
        url: `/purchase/suppliers/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Supplier', 'PurchaseOverview'],
      transformResponse: unwrap<Supplier>,
    }),
    deleteSupplier: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/purchase/suppliers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Supplier', 'PurchaseOverview'],
      transformResponse: unwrap<{ success: boolean; message: string }>,
    }),

    // ── Purchase orders ──
    getPurchaseOrders: builder.query<
      Paginated<PurchaseOrderListItem>,
      ListPurchaseOrdersParams | void
    >({
      query: (params) => ({
        url: '/purchase/purchase-orders',
        params: params || undefined,
      }),
      providesTags: ['PurchaseOrder'],
      transformResponse: unwrap<Paginated<PurchaseOrderListItem>>,
    }),
    getPurchaseOrderStats: builder.query<PurchaseOrderStats, void>({
      query: () => '/purchase/purchase-orders/stats',
      providesTags: ['PurchaseOrder'],
      transformResponse: unwrap<PurchaseOrderStats>,
    }),
    getPurchaseOrder: builder.query<PurchaseOrder, string>({
      query: (id) => `/purchase/purchase-orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PurchaseOrder', id }],
      transformResponse: unwrap<PurchaseOrder>,
    }),
    createPurchaseOrder: builder.mutation<PurchaseOrder, CreatePurchaseOrderRequest>({
      query: (body) => ({ url: '/purchase/purchase-orders', method: 'POST', body }),
      invalidatesTags: ['PurchaseOrder', 'PurchaseOverview'],
      transformResponse: unwrap<PurchaseOrder>,
    }),
    updatePurchaseOrder: builder.mutation<PurchaseOrder, UpdatePurchaseOrderRequest>({
      query: ({ id, ...patch }) => ({
        url: `/purchase/purchase-orders/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'PurchaseOrder', id },
        'PurchaseOrder',
        'PurchaseOverview',
      ],
      transformResponse: unwrap<PurchaseOrder>,
    }),
    cancelPurchaseOrder: builder.mutation<PurchaseOrder, string>({
      query: (id) => ({
        url: `/purchase/purchase-orders/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['PurchaseOrder', 'PurchaseOverview'],
      transformResponse: unwrap<PurchaseOrder>,
    }),
    receivePurchaseOrder: builder.mutation<PurchaseOrder, ReceivePurchaseOrderRequest>({
      query: ({ id, ...body }) => ({
        url: `/purchase/purchase-orders/${id}/receive`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'PurchaseOrder', id },
        'PurchaseOrder',
        'PurchaseOverview',
      ],
      transformResponse: unwrap<PurchaseOrder>,
    }),

    // ── Bills (Purchases) ──
    getBills: builder.query<Paginated<BillListItem>, ListBillsParams | void>({
      query: (params) => ({ url: '/purchase/bills', params: params || undefined }),
      providesTags: ['Purchase'],
      transformResponse: unwrap<Paginated<BillListItem>>,
    }),
    getBillStats: builder.query<BillStats, void>({
      query: () => '/purchase/bills/stats',
      providesTags: ['Purchase'],
      transformResponse: unwrap<BillStats>,
    }),
    getBill: builder.query<Bill, string>({
      query: (id) => `/purchase/bills/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Purchase', id }],
      transformResponse: unwrap<Bill>,
    }),
    createBill: builder.mutation<Bill, CreateBillRequest>({
      query: (body) => ({ url: '/purchase/bills', method: 'POST', body }),
      invalidatesTags: [
        'Purchase',
        'Supplier',
        'PurchaseOrder',
        'PurchaseOverview',
      ],
      transformResponse: unwrap<Bill>,
    }),
    updateBill: builder.mutation<Bill, UpdateBillRequest>({
      query: ({ id, ...patch }) => ({
        url: `/purchase/bills/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Purchase', id }, 'Purchase'],
      transformResponse: unwrap<Bill>,
    }),
    deleteBill: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/purchase/bills/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Purchase', 'Supplier', 'PurchaseOverview'],
      transformResponse: unwrap<{ success: boolean; message: string }>,
    }),

    // ── Supplier payments ──
    getSupplierPayments: builder.query<
      Paginated<SupplierPayment>,
      ListSupplierPaymentsParams | void
    >({
      query: (params) => ({
        url: '/purchase/supplier-payments',
        params: params || undefined,
      }),
      providesTags: ['SupplierPayment'],
      transformResponse: unwrap<Paginated<SupplierPayment>>,
    }),
    recordSupplierPayment: builder.mutation<
      SupplierPayment,
      RecordSupplierPaymentRequest
    >({
      query: (body) => ({
        url: '/purchase/supplier-payments',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'SupplierPayment',
        'Purchase',
        'Supplier',
        'PurchaseOverview',
      ],
      transformResponse: unwrap<SupplierPayment>,
    }),
  }),
});

export const {
  useGetPurchaseOverviewQuery,
  useGetSuppliersQuery,
  useGetSupplierStatsQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderStatsQuery,
  useGetPurchaseOrderQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  useGetBillsQuery,
  useGetBillStatsQuery,
  useGetBillQuery,
  useCreateBillMutation,
  useUpdateBillMutation,
  useDeleteBillMutation,
  useGetSupplierPaymentsQuery,
  useRecordSupplierPaymentMutation,
} = purchaseApi;
