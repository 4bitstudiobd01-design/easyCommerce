import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

export type FinanceAccountType = 'CASH' | 'BANK' | 'PAYMENT_GATEWAY' | 'DIGITAL_WALLET';
export type FinanceTransactionType = 'INCOME' | 'EXPENSE' | 'PAYMENT' | 'REFUND' | 'TRANSFER' | 'ADJUSTMENT';
export type FinanceTransactionStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED';
export type FinanceCategoryType = 'INCOME' | 'EXPENSE';
export type FinanceInvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';
export type FinanceBillStatus = 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';
export type FinanceTransferStatus = 'COMPLETED' | 'CANCELLED';
export type FinanceSourceType = 'MANUAL' | 'ORDER' | 'INVOICE' | 'BILL' | 'HR_EXPENSE' | 'PAYROLL' | 'TRANSFER' | 'ADJUSTMENT';

export interface FinanceAccount {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  type: FinanceAccountType;
  accountNumber?: string;
  bankOrProviderName?: string;
  currency: string;
  currentBalance: string;
  startingBalance: string;
  isDefault: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceCategory {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  code: string;
  type: FinanceCategoryType;
  isSystem: boolean;
  color?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransaction {
  id: string;
  tenantId: string;
  storeId: string;
  transactionNumber: string;
  type: FinanceTransactionType;
  amount: string;
  currency: string;
  transactionDate: string;
  accountId?: string;
  account?: FinanceAccount;
  toAccountId?: string;
  toAccount?: FinanceAccount;
  categoryId?: string;
  category?: FinanceCategory;
  categoryCode?: string;
  description?: string;
  reference?: string;
  sourceType: FinanceSourceType;
  sourceId?: string;
  paymentMethod?: string;
  status: FinanceTransactionStatus;
  receiptFileId?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceInvoiceItem {
  id: string;
  invoiceId: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: string;
  taxRate: string;
  totalAmount: string;
  productId?: string;
  createdAt: string;
}

export interface FinanceInvoice {
  id: string;
  tenantId: string;
  storeId: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  paidAmount: string;
  balanceDue: string;
  currency: string;
  status: FinanceInvoiceStatus;
  notes?: string;
  terms?: string;
  orderId?: string;
  items: FinanceInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FinanceBillItem {
  id: string;
  billId: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: string;
  taxRate: string;
  totalAmount: string;
  createdAt: string;
}

export interface FinanceBill {
  id: string;
  tenantId: string;
  storeId: string;
  billNumber: string;
  supplierName: string;
  supplierContact?: string;
  supplierEmail?: string;
  category: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  paidAmount: string;
  balanceDue: string;
  currency: string;
  status: FinanceBillStatus;
  notes?: string;
  attachmentFileId?: string;
  items: FinanceBillItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransfer {
  id: string;
  tenantId: string;
  storeId: string;
  transferNumber: string;
  fromAccountId: string;
  fromAccount?: FinanceAccount;
  toAccountId: string;
  toAccount?: FinanceAccount;
  amount: string;
  fee: string;
  currency: string;
  transferDate: string;
  reference?: string;
  notes?: string;
  status: FinanceTransferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSettings {
  id: string;
  tenantId: string;
  storeId: string;
  currency: string;
  currencySymbol: string;
  defaultTaxRate: string;
  taxNumber?: string;
  invoicePrefix: string;
  billPrefix: string;
  defaultSalesAccountId?: string;
  defaultExpenseAccountId?: string;
  invoiceFooterNote?: string;
  invoiceTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceOverview {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalReceivables: number;
    totalPayables: number;
    totalAccountBalance: number;
    currency: string;
  };
  accounts: FinanceAccount[];
  recentTransactions: FinanceTransaction[];
  revenueVsExpenseTrend: Array<{
    month: string;
    revenue: number;
    expense: number;
    profit: number;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IncomeResponse extends PaginatedResponse<FinanceTransaction> {
  summary: {
    totalIncome: number;
    totalProductSales: number;
    totalShippingIncome: number;
    totalOtherIncome: number;
  };
}

export interface ExpensesResponse extends PaginatedResponse<FinanceTransaction> {
  summary: {
    totalExpense: number;
    categoryBreakdown: Record<string, number>;
  };
}

export interface InvoicesResponse extends PaginatedResponse<FinanceInvoice> {
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalUnpaid: number;
    totalOverdue: number;
  };
}

export interface BillsResponse extends PaginatedResponse<FinanceBill> {
  summary: {
    totalBilled: number;
    totalPaid: number;
    totalUnpaid: number;
    totalOverdue: number;
  };
}

export interface ProfitLossReport {
  dateRange: { startDate: string; endDate: string };
  revenue: {
    productSales: number;
    shippingIncome: number;
    otherIncome: number;
    totalRevenue: number;
  };
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: {
    marketing: number;
    salary: number;
    employeeExpenses: number;
    rent: number;
    utilities: number;
    software: number;
    shipping: number;
    other: number;
    totalOperatingExpenses: number;
  };
  netProfit: number;
  netMarginPercent: number;
  currency: string;
}

export interface CashFlowReport {
  dateRange: { startDate: string; endDate: string };
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  currentTotalBalance: number;
  accountsSummary: Array<{
    accountId: string;
    accountName: string;
    accountType: string;
    inflow: number;
    outflow: number;
    netChange: number;
  }>;
  currency: string;
}

export interface ReceivablesReport {
  aging: {
    current: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    over90Days: number;
    totalReceivables: number;
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    status: FinanceInvoiceStatus;
    daysOverdue: number;
    bucket: string;
  }>;
  currency: string;
}

export interface PayablesReport {
  aging: {
    current: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    over90Days: number;
    totalPayables: number;
  };
  bills: Array<{
    id: string;
    billNumber: string;
    supplierName: string;
    supplierContact?: string;
    supplierEmail?: string;
    category: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    status: FinanceBillStatus;
    daysOverdue: number;
    bucket: string;
  }>;
  currency: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1` : 'http://localhost:5000/api/v1');

export const financeApi = createApi({
  reducerPath: 'financeApi',
  baseQuery: createBaseQueryWithReauth(BASE_URL),
  tagTypes: [
    'FinanceOverview',
    'FinanceTransactions',
    'FinanceIncome',
    'FinanceExpenses',
    'FinanceInvoices',
    'FinanceBills',
    'FinanceAccounts',
    'FinanceTransfers',
    'FinanceReports',
    'FinanceSettings',
    'FinanceCategories',
  ],
  endpoints: (builder) => ({
    getFinanceOverview: builder.query<FinanceOverview, void>({
      query: () => '/finance/overview',
      providesTags: ['FinanceOverview'],
    }),

    getTransactions: builder.query<
      PaginatedResponse<FinanceTransaction>,
      {
        type?: string;
        status?: string;
        sourceType?: string;
        accountId?: string;
        categoryCode?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: '/finance/transactions',
        params,
      }),
      providesTags: ['FinanceTransactions'],
    }),

    createTransaction: builder.mutation<
      FinanceTransaction,
      {
        type: FinanceTransactionType;
        amount: number;
        currency?: string;
        transactionDate: string;
        accountId?: string;
        toAccountId?: string;
        categoryCode?: string;
        description?: string;
        reference?: string;
        paymentMethod?: string;
      }
    >({
      query: (body) => ({
        url: '/finance/transactions',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'FinanceTransactions',
        'FinanceOverview',
        'FinanceIncome',
        'FinanceExpenses',
        'FinanceAccounts',
        'FinanceReports',
      ],
    }),

    deleteTransaction: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/finance/transactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        'FinanceTransactions',
        'FinanceOverview',
        'FinanceIncome',
        'FinanceExpenses',
        'FinanceAccounts',
        'FinanceReports',
      ],
    }),

    getIncome: builder.query<
      IncomeResponse,
      {
        status?: string;
        accountId?: string;
        categoryCode?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: '/finance/income',
        params,
      }),
      providesTags: ['FinanceIncome'],
    }),

    createIncome: builder.mutation<
      FinanceTransaction,
      {
        amount: number;
        transactionDate: string;
        categoryCode: string;
        accountId?: string;
        description?: string;
        reference?: string;
        paymentMethod?: string;
      }
    >({
      query: (body) => ({
        url: '/finance/income',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'FinanceIncome',
        'FinanceTransactions',
        'FinanceOverview',
        'FinanceAccounts',
        'FinanceReports',
      ],
    }),

    getExpenses: builder.query<
      ExpensesResponse,
      {
        status?: string;
        accountId?: string;
        categoryCode?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: '/finance/expenses',
        params,
      }),
      providesTags: ['FinanceExpenses'],
    }),

    createExpense: builder.mutation<
      FinanceTransaction,
      {
        amount: number;
        transactionDate: string;
        categoryCode: string;
        accountId?: string;
        description?: string;
        reference?: string;
        paymentMethod?: string;
        receiptFileId?: string;
      }
    >({
      query: (body) => ({
        url: '/finance/expenses',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'FinanceExpenses',
        'FinanceTransactions',
        'FinanceOverview',
        'FinanceAccounts',
        'FinanceReports',
      ],
    }),

    getInvoices: builder.query<
      InvoicesResponse,
      {
        status?: string;
        customerId?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: '/finance/invoices',
        params,
      }),
      providesTags: ['FinanceInvoices'],
    }),

    createInvoice: builder.mutation<
      FinanceInvoice,
      {
        customerName: string;
        customerEmail?: string;
        customerPhone?: string;
        customerAddress?: string;
        issueDate: string;
        dueDate: string;
        discountAmount?: number;
        currency?: string;
        notes?: string;
        terms?: string;
        items: Array<{
          title: string;
          description?: string;
          quantity: number;
          unitPrice: number;
          taxRate?: number;
        }>;
      }
    >({
      query: (body) => ({
        url: '/finance/invoices',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinanceInvoices', 'FinanceOverview', 'FinanceReports'],
    }),

    getInvoice: builder.query<FinanceInvoice, string>({
      query: (id) => `/finance/invoices/${id}`,
      providesTags: ['FinanceInvoices'],
    }),

    updateInvoiceStatus: builder.mutation<FinanceInvoice, { id: string; status: FinanceInvoiceStatus }>({
      query: ({ id, status }) => ({
        url: `/finance/invoices/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['FinanceInvoices', 'FinanceOverview', 'FinanceReports'],
    }),

    recordInvoicePayment: builder.mutation<
      FinanceInvoice,
      {
        id: string;
        amount: number;
        paymentDate: string;
        accountId?: string;
        paymentMethod?: string;
        reference?: string;
        notes?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/finance/invoices/${id}/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'FinanceInvoices',
        'FinanceTransactions',
        'FinanceOverview',
        'FinanceIncome',
        'FinanceAccounts',
        'FinanceReports',
      ],
    }),

    deleteInvoice: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/finance/invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FinanceInvoices', 'FinanceOverview', 'FinanceReports'],
    }),

    getBills: builder.query<
      BillsResponse,
      {
        status?: string;
        category?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: '/finance/bills',
        params,
      }),
      providesTags: ['FinanceBills'],
    }),

    createBill: builder.mutation<
      FinanceBill,
      {
        supplierName: string;
        supplierContact?: string;
        supplierEmail?: string;
        category?: string;
        issueDate: string;
        dueDate: string;
        currency?: string;
        notes?: string;
        items: Array<{
          title: string;
          description?: string;
          quantity: number;
          unitPrice: number;
          taxRate?: number;
        }>;
      }
    >({
      query: (body) => ({
        url: '/finance/bills',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinanceBills', 'FinanceOverview', 'FinanceReports'],
    }),

    getBill: builder.query<FinanceBill, string>({
      query: (id) => `/finance/bills/${id}`,
      providesTags: ['FinanceBills'],
    }),

    updateBillStatus: builder.mutation<FinanceBill, { id: string; status: FinanceBillStatus }>({
      query: ({ id, status }) => ({
        url: `/finance/bills/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['FinanceBills', 'FinanceOverview', 'FinanceReports'],
    }),

    recordBillPayment: builder.mutation<
      FinanceBill,
      {
        id: string;
        amount: number;
        paymentDate: string;
        accountId?: string;
        paymentMethod?: string;
        reference?: string;
        notes?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/finance/bills/${id}/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'FinanceBills',
        'FinanceTransactions',
        'FinanceOverview',
        'FinanceExpenses',
        'FinanceAccounts',
        'FinanceReports',
      ],
    }),

    deleteBill: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/finance/bills/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FinanceBills', 'FinanceOverview', 'FinanceReports'],
    }),

    getAccounts: builder.query<{ items: FinanceAccount[]; totalBalance: number }, void>({
      query: () => '/finance/accounts',
      providesTags: ['FinanceAccounts'],
    }),

    createAccount: builder.mutation<
      FinanceAccount,
      {
        name: string;
        type: FinanceAccountType;
        accountNumber?: string;
        bankOrProviderName?: string;
        startingBalance?: number;
        isDefault?: boolean;
        notes?: string;
      }
    >({
      query: (body) => ({
        url: '/finance/accounts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinanceAccounts', 'FinanceOverview'],
    }),

    updateAccount: builder.mutation<FinanceAccount, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/finance/accounts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['FinanceAccounts', 'FinanceOverview'],
    }),

    getAccountStatement: builder.query<
      {
        account: FinanceAccount;
        transactions: FinanceTransaction[];
        summary: {
          startingBalance: number;
          currentBalance: number;
          totalInflow: number;
          totalOutflow: number;
        };
      },
      string
    >({
      query: (id) => `/finance/accounts/${id}/statement`,
      providesTags: ['FinanceAccounts', 'FinanceTransactions'],
    }),

    getTransfers: builder.query<{ items: FinanceTransfer[]; totalTransferred: number }, void>({
      query: () => '/finance/transfers',
      providesTags: ['FinanceTransfers'],
    }),

    createTransfer: builder.mutation<
      FinanceTransfer,
      {
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        fee?: number;
        transferDate: string;
        reference?: string;
        notes?: string;
      }
    >({
      query: (body) => ({
        url: '/finance/transfers',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'FinanceTransfers',
        'FinanceAccounts',
        'FinanceTransactions',
        'FinanceOverview',
      ],
    }),

    getProfitLossReport: builder.query<
      ProfitLossReport,
      { period?: string; startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: '/finance/reports/profit-loss',
        params,
      }),
      providesTags: ['FinanceReports'],
    }),

    getCashFlowReport: builder.query<
      CashFlowReport,
      { period?: string; startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: '/finance/reports/cash-flow',
        params,
      }),
      providesTags: ['FinanceReports'],
    }),

    getReceivablesReport: builder.query<ReceivablesReport, void>({
      query: () => '/finance/reports/receivables',
      providesTags: ['FinanceReports', 'FinanceInvoices'],
    }),

    getPayablesReport: builder.query<PayablesReport, void>({
      query: () => '/finance/reports/payables',
      providesTags: ['FinanceReports', 'FinanceBills'],
    }),

    getFinanceSettings: builder.query<FinanceSettings, void>({
      query: () => '/finance/settings',
      providesTags: ['FinanceSettings'],
    }),

    updateFinanceSettings: builder.mutation<FinanceSettings, Partial<FinanceSettings>>({
      query: (body) => ({
        url: '/finance/settings',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['FinanceSettings', 'FinanceOverview'],
    }),

    getCategories: builder.query<FinanceCategory[], { type?: FinanceCategoryType } | void>({
      query: (params) => ({
        url: '/finance/categories',
        params: params || undefined,
      }),
      providesTags: ['FinanceCategories'],
    }),

    createCategory: builder.mutation<
      FinanceCategory,
      {
        name: string;
        code: string;
        type: FinanceCategoryType;
        color?: string;
        description?: string;
      }
    >({
      query: (body) => ({
        url: '/finance/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinanceCategories'],
    }),
  }),
});

export const {
  useGetFinanceOverviewQuery,
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useGetIncomeQuery,
  useCreateIncomeMutation,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useGetInvoiceQuery,
  useUpdateInvoiceStatusMutation,
  useRecordInvoicePaymentMutation,
  useDeleteInvoiceMutation,
  useGetBillsQuery,
  useCreateBillMutation,
  useGetBillQuery,
  useUpdateBillStatusMutation,
  useRecordBillPaymentMutation,
  useDeleteBillMutation,
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useGetAccountStatementQuery,
  useGetTransfersQuery,
  useCreateTransferMutation,
  useGetProfitLossReportQuery,
  useGetCashFlowReportQuery,
  useGetReceivablesReportQuery,
  useGetPayablesReportQuery,
  useGetFinanceSettingsQuery,
  useUpdateFinanceSettingsMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
} = financeApi;
