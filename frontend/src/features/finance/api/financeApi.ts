import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

export type FinanceAccountType = 'CASH' | 'BANK' | 'PAYMENT_GATEWAY' | 'DIGITAL_WALLET';
export type FinanceAccountClass = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type FinanceNormalBalance = 'DEBIT' | 'CREDIT';
export type FinanceLineType = 'DEBIT' | 'CREDIT';
export type FinanceJournalStatus = 'DRAFT' | 'POSTED' | 'VOID';
export type FinanceJournalEntryType =
  | 'MANUAL'
  | 'ORDER'
  | 'REFUND'
  | 'INVOICE'
  | 'BILL'
  | 'PAYROLL'
  | 'HR_EXPENSE'
  | 'TRANSFER'
  | 'INVENTORY_ADJUSTMENT'
  | 'PERIOD_CLOSING';
export type FinancePartyType = 'CUSTOMER' | 'SUPPLIER' | 'EMPLOYEE' | 'COURIER' | 'NONE';

export type FinanceTransactionType = 'INCOME' | 'EXPENSE' | 'PAYMENT' | 'REFUND' | 'TRANSFER' | 'ADJUSTMENT';
export type FinanceTransactionStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED';
export type FinanceCategoryType = 'INCOME' | 'EXPENSE';
export type FinanceInvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';
export type FinanceBillStatus = 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';
export type FinanceTransferStatus = 'COMPLETED' | 'CANCELLED';
export type FinanceSourceType =
  | 'MANUAL'
  | 'ORDER'
  | 'INVOICE'
  | 'BILL'
  | 'HR_EXPENSE'
  | 'PAYROLL'
  | 'TRANSFER'
  | 'ADJUSTMENT';

export interface FinanceChartOfAccount {
  id: string;
  tenantId: string;
  storeId: string;
  code: string;
  name: string;
  accountClass: FinanceAccountClass;
  subType: string;
  normalBalance: FinanceNormalBalance;
  parentId?: string;
  parent?: FinanceChartOfAccount;
  currentBalance: string;
  currency: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceJournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  account?: FinanceChartOfAccount;
  accountCode: string;
  accountName: string;
  type: FinanceLineType;
  amount: string;
  description?: string;
  partyType: FinancePartyType;
  partyId?: string;
  partyName?: string;
  createdAt: string;
}

export interface FinanceJournalEntry {
  id: string;
  tenantId: string;
  storeId: string;
  entryNumber: string;
  entryDate: string;
  postingDate: string;
  sourceType: FinanceJournalEntryType;
  sourceId?: string;
  sourceReference?: string;
  description: string;
  notes?: string;
  totalDebit: string;
  totalCredit: string;
  isBalanced: boolean;
  status: FinanceJournalStatus;
  currency: string;
  postedByUserId?: string;
  postedByName?: string;
  lines: FinanceJournalLine[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneralLedgerTransaction {
  id: string;
  entryDate: string;
  entryNumber: string;
  sourceType: string;
  sourceReference?: string;
  description: string;
  partyType?: string;
  partyName?: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface GeneralLedgerStatement {
  account: {
    id: string;
    code: string;
    name: string;
    accountClass: FinanceAccountClass;
    subType: string;
    normalBalance: FinanceNormalBalance;
    currency: string;
  };
  dateRange: { startDate: string; endDate: string };
  openingBalance: number;
  closingBalance: number;
  periodDebits: number;
  periodCredits: number;
  transactions: GeneralLedgerTransaction[];
}

export interface TrialBalanceAccountItem {
  id: string;
  code: string;
  name: string;
  accountClass: FinanceAccountClass;
  subType: string;
  normalBalance: FinanceNormalBalance;
  totalDebits: number;
  totalCredits: number;
  debitBalance: number;
  creditBalance: number;
}

export interface TrialBalanceReport {
  dateRange: { startDate: string; endDate: string };
  asOfDate: string;
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  accounts: TrialBalanceAccountItem[];
  currency: string;
}

export interface BalanceSheetReport {
  asOfDate: string;
  dateRange: { startDate: string; endDate: string };
  assets: {
    currentAssets: Array<{ id: string; code: string; name: string; balance: number }>;
    totalCurrentAssets: number;
    nonCurrentAssets: Array<{ id: string; code: string; name: string; balance: number }>;
    totalNonCurrentAssets: number;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: Array<{ id: string; code: string; name: string; balance: number }>;
    totalCurrentLiabilities: number;
    longTermLiabilities: Array<{ id: string; code: string; name: string; balance: number }>;
    totalLongTermLiabilities: number;
    totalLiabilities: number;
  };
  equity: {
    equityItems: Array<{ id: string; code: string; name: string; balance: number }>;
    baseEquity: number;
    currentPeriodNetIncome: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  difference: number;
  currency: string;
}

export interface TaxVatReport {
  dateRange: { startDate: string; endDate: string };
  summary: {
    totalTaxableSales: number;
    outputVatCollected: number;
    totalTaxablePurchases: number;
    inputVatPaid: number;
    netVatPayable: number;
    currentTaxLiabilityBalance: number;
  };
  outputVatInvoices: Array<{
    id: string;
    number: string;
    customerName: string;
    date: string;
    taxableAmount: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
  }>;
  inputVatBills: Array<{
    id: string;
    number: string;
    supplierName: string;
    date: string;
    taxableAmount: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
  }>;
  currency: string;
}

export interface FinancePeriodLock {
  id: string;
  tenantId: string;
  storeId: string;
  periodName: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
  lockedAt: string;
  lockedByUserId?: string;
  lockedByName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

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
    grossProfit: number;
    grossMarginPercent: number;
    netProfit: number;
    netMarginPercent: number;
    cogs: number;
    payrollCost: number;
    marketingCost: number;
    inventoryCost: number;
    totalReceivables: number;
    totalPayables: number;
    totalAccountBalance: number;
    currency: string;
  };
  growth: {
    revenueGrowth: number;
    expenseGrowth: number;
    grossProfitGrowth: number;
    netProfitGrowth: number;
    cogsChange: number;
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

export interface AccountsResponse {
  items: FinanceAccount[];
  totalBalance: number;
}

export interface TransfersResponse {
  items: FinanceTransfer[];
  totalTransferred: number;
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
  previousDateRange?: { startDate: string; endDate: string };
  current: {
    revenue: {
      productSales: number;
      shippingIncome: number;
      otherIncome: number;
      salesDiscounts: number;
      salesReturns: number;
      grossRevenue: number;
      totalRevenue: number;
    };
    cogs: {
      productCost: number;
      packaging: number;
      gatewayFees: number;
      shippingFees: number;
      totalCogs: number;
    };
    grossProfit: number;
    grossMarginPercent: number;
    operatingExpenses: {
      salary: number;
      employeeBenefits: number;
      marketing: number;
      software: number;
      rent: number;
      utilities: number;
      bankFees: number;
      inventoryLoss: number;
      other: number;
      totalOperatingExpenses: number;
    };
    operatingProfit: number;
    operatingMarginPercent: number;
    netProfit: number;
    netMarginPercent: number;
  };
  previous?: {
    revenue: {
      productSales: number;
      shippingIncome: number;
      otherIncome: number;
      salesDiscounts: number;
      salesReturns: number;
      grossRevenue: number;
      totalRevenue: number;
    };
    cogs: {
      productCost: number;
      packaging: number;
      gatewayFees: number;
      shippingFees: number;
      totalCogs: number;
    };
    grossProfit: number;
    grossMarginPercent: number;
    operatingExpenses: {
      salary: number;
      employeeBenefits: number;
      marketing: number;
      software: number;
      rent: number;
      utilities: number;
      bankFees: number;
      inventoryLoss: number;
      other: number;
      totalOperatingExpenses: number;
    };
    operatingProfit: number;
    operatingMarginPercent: number;
    netProfit: number;
    netMarginPercent: number;
  };
  growth: {
    revenueGrowth: number;
    cogsGrowth: number;
    grossProfitGrowth: number;
    operatingExpensesGrowth: number;
    netProfitGrowth: number;
  };
  currency: string;
}

export interface CashFlowReport {
  dateRange: { startDate: string; endDate: string };
  operatingActivities: {
    cashInflow: number;
    cashOutflow: number;
    netCashFlow: number;
  };
  investingActivities: {
    cashInflow: number;
    cashOutflow: number;
    netCashFlow: number;
  };
  financingActivities: {
    cashInflow: number;
    cashOutflow: number;
    netCashFlow: number;
  };
  summary: {
    beginningCashBalance: number;
    netChangeInCash: number;
    endingCashBalance: number;
  };
  accountsSummary: Array<{
    accountId: string;
    accountName: string;
    accountType: string;
    currentBalance: number;
    isDefault: boolean;
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
    'FinanceChartOfAccounts',
    'FinanceJournalEntries',
    'FinanceGeneralLedger',
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
    'FinancePeriodLocks',
  ],
  endpoints: (builder) => ({
    getFinanceOverview: builder.query<FinanceOverview, void>({
      query: () => '/finance/overview',
      providesTags: ['FinanceOverview'],
    }),

    // Chart of Accounts
    getChartOfAccounts: builder.query<
      { accounts: FinanceChartOfAccount[]; summary: any },
      { accountClass?: string; search?: string; isActive?: boolean } | void
    >({
      query: (params) => ({
        url: '/finance/chart-of-accounts',
        params: params || {},
      }),
      providesTags: ['FinanceChartOfAccounts'],
    }),

    createChartOfAccount: builder.mutation<
      FinanceChartOfAccount,
      {
        code: string;
        name: string;
        accountClass: FinanceAccountClass;
        subType?: string;
        normalBalance: FinanceNormalBalance;
        parentId?: string;
        description?: string;
        startingBalance?: number;
      }
    >({
      query: (body) => ({
        url: '/finance/chart-of-accounts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinanceChartOfAccounts', 'FinanceOverview'],
    }),

    updateChartOfAccount: builder.mutation<
      FinanceChartOfAccount,
      {
        id: string;
        name?: string;
        subType?: string;
        parentId?: string;
        description?: string;
        isActive?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/finance/chart-of-accounts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['FinanceChartOfAccounts'],
    }),

    // Journal Entries
    getJournalEntries: builder.query<
      { items: FinanceJournalEntry[]; total: number; page: number; limit: number; totalPages: number; summary: any },
      {
        sourceType?: string;
        status?: string;
        accountId?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => ({
        url: '/finance/journal-entries',
        params: params || {},
      }),
      providesTags: ['FinanceJournalEntries'],
    }),

    postJournalEntry: builder.mutation<
      FinanceJournalEntry,
      {
        entryDate: string;
        description: string;
        sourceType?: FinanceJournalEntryType;
        sourceId?: string;
        sourceReference?: string;
        notes?: string;
        lines: Array<{
          accountId: string;
          type: FinanceLineType;
          amount: number;
          description?: string;
          partyType?: FinancePartyType;
          partyId?: string;
          partyName?: string;
        }>;
      }
    >({
      query: (body) => ({
        url: '/finance/journal-entries',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'FinanceJournalEntries',
        'FinanceChartOfAccounts',
        'FinanceGeneralLedger',
        'FinanceReports',
        'FinanceOverview',
      ],
    }),

    // General Ledger
    getGeneralLedger: builder.query<
      GeneralLedgerStatement,
      { accountId: string; startDate?: string; endDate?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/finance/general-ledger',
        params,
      }),
      providesTags: ['FinanceGeneralLedger'],
    }),

    // Financial Reports
    getTrialBalanceReport: builder.query<
      TrialBalanceReport,
      { period?: string; startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: '/finance/reports/trial-balance',
        params: params || {},
      }),
      providesTags: ['FinanceReports'],
    }),

    getBalanceSheetReport: builder.query<
      BalanceSheetReport,
      { period?: string; startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: '/finance/reports/balance-sheet',
        params: params || {},
      }),
      providesTags: ['FinanceReports'],
    }),

    getProfitLossReport: builder.query<
      ProfitLossReport,
      { period?: string; startDate?: string; endDate?: string; compareWith?: string } | void
    >({
      query: (params) => ({
        url: '/finance/reports/profit-loss',
        params: params || {},
      }),
      providesTags: ['FinanceReports'],
    }),

    getCashFlowReport: builder.query<
      CashFlowReport,
      { period?: string; startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: '/finance/reports/cash-flow',
        params: params || {},
      }),
      providesTags: ['FinanceReports'],
    }),

    getTaxVatReport: builder.query<
      TaxVatReport,
      { period?: string; startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: '/finance/reports/tax-vat',
        params: params || {},
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

    // Period Closing Locks
    getPeriodLocks: builder.query<FinancePeriodLock[], void>({
      query: () => '/finance/period-locks',
      providesTags: ['FinancePeriodLocks'],
    }),

    lockPeriod: builder.mutation<
      FinancePeriodLock,
      { periodName: string; startDate: string; endDate: string; notes?: string }
    >({
      query: (body) => ({
        url: '/finance/period-locks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinancePeriodLocks', 'FinanceJournalEntries'],
    }),

    unlockPeriod: builder.mutation<FinancePeriodLock, string>({
      query: (id) => ({
        url: `/finance/period-locks/${id}/unlock`,
        method: 'PATCH',
      }),
      invalidatesTags: ['FinancePeriodLocks', 'FinanceJournalEntries'],
    }),

    // Transactions
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
        transactionDate?: string;
        accountId?: string;
        categoryId?: string;
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
        'FinanceAccounts',
        'FinanceIncome',
        'FinanceExpenses',
        'FinanceReports',
      ],
    }),

    deleteTransaction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/finance/transactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        'FinanceTransactions',
        'FinanceOverview',
        'FinanceAccounts',
        'FinanceIncome',
        'FinanceExpenses',
        'FinanceReports',
      ],
    }),

    // Income & Expenses
    getIncome: builder.query<
      IncomeResponse,
      {
        categoryCode?: string;
        accountId?: string;
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
        categoryCode?: string;
        accountId?: string;
        description?: string;
        reference?: string;
        paymentMethod?: string;
        transactionDate?: string;
      }
    >({
      query: (body) => ({
        url: '/finance/income',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinanceIncome', 'FinanceTransactions', 'FinanceOverview', 'FinanceAccounts', 'FinanceReports'],
    }),

    getExpenses: builder.query<
      ExpensesResponse,
      {
        categoryCode?: string;
        accountId?: string;
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
        categoryCode: string;
        accountId?: string;
        description?: string;
        reference?: string;
        paymentMethod?: string;
        transactionDate?: string;
        receiptFileId?: string;
      }
    >({
      query: (body) => ({
        url: '/finance/expenses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinanceExpenses', 'FinanceTransactions', 'FinanceOverview', 'FinanceAccounts', 'FinanceReports'],
    }),

    // Invoices
    getInvoices: builder.query<
      InvoicesResponse,
      {
        status?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
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

    getInvoice: builder.query<FinanceInvoice, string>({
      query: (id) => `/finance/invoices/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'FinanceInvoices', id }],
    }),

    createInvoice: builder.mutation<
      FinanceInvoice,
      {
        customerName: string;
        customerId?: string;
        customerEmail?: string;
        customerPhone?: string;
        customerAddress?: string;
        issueDate?: string;
        dueDate?: string;
        discountAmount?: number;
        taxAmount?: number;
        shippingFee?: number;
        notes?: string;
        terms?: string;
        items: Array<{
          title: string;
          description?: string;
          quantity: number;
          unitPrice: number;
          taxRate?: number;
          productId?: string;
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
        accountId?: string;
        paymentMethod?: string;
        paymentDate?: string;
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
        'FinanceOverview',
        'FinanceAccounts',
        'FinanceTransactions',
        'FinanceReports',
      ],
    }),

    deleteInvoice: builder.mutation<void, string>({
      query: (id) => ({
        url: `/finance/invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FinanceInvoices', 'FinanceOverview', 'FinanceReports'],
    }),

    // Bills
    getBills: builder.query<
      BillsResponse,
      {
        status?: string;
        category?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
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

    getBill: builder.query<FinanceBill, string>({
      query: (id) => `/finance/bills/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'FinanceBills', id }],
    }),

    createBill: builder.mutation<
      FinanceBill,
      {
        supplierName: string;
        supplierContact?: string;
        supplierEmail?: string;
        category?: string;
        issueDate?: string;
        dueDate?: string;
        discountAmount?: number;
        taxAmount?: number;
        shippingFee?: number;
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
        accountId?: string;
        paymentMethod?: string;
        paymentDate?: string;
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
        'FinanceOverview',
        'FinanceAccounts',
        'FinanceTransactions',
        'FinanceReports',
      ],
    }),

    deleteBill: builder.mutation<void, string>({
      query: (id) => ({
        url: `/finance/bills/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FinanceBills', 'FinanceOverview', 'FinanceReports'],
    }),

    // Accounts
    getAccounts: builder.query<AccountsResponse, void>({
      query: () => '/finance/accounts',
      transformResponse: (response: any) => {
        if (Array.isArray(response)) {
          return {
            items: response,
            totalBalance: response.reduce((sum, a) => sum + Number(a.currentBalance || 0), 0),
          };
        }
        return {
          items: Array.isArray(response?.items) ? response.items : [],
          totalBalance: Number(response?.totalBalance || 0),
        };
      },
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
        currency?: string;
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

    updateAccount: builder.mutation<
      FinanceAccount,
      {
        id: string;
        name?: string;
        type?: FinanceAccountType;
        accountNumber?: string;
        bankOrProviderName?: string;
        isDefault?: boolean;
        isActive?: boolean;
        notes?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/finance/accounts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['FinanceAccounts', 'FinanceOverview'],
    }),

    getAccountStatement: builder.query<
      any,
      string | { id: string; startDate?: string; endDate?: string }
    >({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        const params = typeof arg === 'string' ? {} : { startDate: arg.startDate, endDate: arg.endDate };
        return {
          url: `/finance/accounts/${id}/statement`,
          params,
        };
      },
    }),

    // Transfers
    getTransfers: builder.query<TransfersResponse, void>({
      query: () => '/finance/transfers',
      transformResponse: (response: any) => {
        if (Array.isArray(response)) {
          return {
            items: response,
            totalTransferred: response.reduce((sum, t) => sum + Number(t.amount || 0), 0),
          };
        }
        return {
          items: Array.isArray(response?.items) ? response.items : [],
          totalTransferred: Number(response?.totalTransferred || 0),
        };
      },
      providesTags: ['FinanceTransfers'],
    }),

    createTransfer: builder.mutation<
      FinanceTransfer,
      {
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        fee?: number;
        transferDate?: string;
        reference?: string;
        notes?: string;
      }
    >({
      query: (body) => ({
        url: '/finance/transfers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinanceTransfers', 'FinanceAccounts', 'FinanceOverview', 'FinanceTransactions', 'FinanceReports'],
    }),

    // Settings & Categories
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
      invalidatesTags: ['FinanceSettings'],
    }),

    getCategories: builder.query<FinanceCategory[], { type?: FinanceCategoryType } | FinanceCategoryType | void>({
      query: (arg) => {
        let type: FinanceCategoryType | undefined;
        if (typeof arg === 'string') {
          type = arg;
        } else if (arg && typeof arg === 'object' && 'type' in arg) {
          type = arg.type;
        }
        return {
          url: '/finance/categories',
          params: type ? { type } : undefined,
        };
      },
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
  useGetChartOfAccountsQuery,
  useCreateChartOfAccountMutation,
  useUpdateChartOfAccountMutation,
  useGetJournalEntriesQuery,
  usePostJournalEntryMutation,
  useGetGeneralLedgerQuery,
  useGetTrialBalanceReportQuery,
  useGetBalanceSheetReportQuery,
  useGetProfitLossReportQuery,
  useGetCashFlowReportQuery,
  useGetTaxVatReportQuery,
  useGetReceivablesReportQuery,
  useGetPayablesReportQuery,
  useGetPeriodLocksQuery,
  useLockPeriodMutation,
  useUnlockPeriodMutation,
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useGetIncomeQuery,
  useCreateIncomeMutation,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceStatusMutation,
  useRecordInvoicePaymentMutation,
  useDeleteInvoiceMutation,
  useGetBillsQuery,
  useGetBillQuery,
  useCreateBillMutation,
  useUpdateBillStatusMutation,
  useRecordBillPaymentMutation,
  useDeleteBillMutation,
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useGetAccountStatementQuery,
  useGetTransfersQuery,
  useCreateTransferMutation,
  useGetFinanceSettingsQuery,
  useUpdateFinanceSettingsMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
} = financeApi;
