import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

export type FinanceAccountType = 'CASH' | 'BANK' | 'CARD' | 'PAYMENT_GATEWAY' | 'DIGITAL_WALLET';
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
export type FinanceInvoiceStatus = 'DRAFT' | 'PENDING' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';
export type FinanceBillStatus = 'DRAFT' | 'PENDING' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';
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
  receiptFile?: {
    id: string;
    url: string;
    fileName?: string;
    mimeType?: string;
    sizeInBytes?: number | string;
  };
  createdByUserId?: string;
  createdByUser?: {
    id: string;
    fullName?: string;
    email?: string;
  };
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
  payments?: FinanceTransaction[];
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
  payments?: FinanceTransaction[];
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

export interface CategoryExpenseBreakdownItem {
  code: string;
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface AccountMonthlyBreakdownItem {
  accountId: string;
  accountName: string;
  accountType: string;
  accountNumber?: string;
  bankOrProviderName?: string;
  currentBalance: number;
  thisMonthDebit: number;
  thisMonthCredit: number;
  thisMonthNet: number;
  lastMonthDebit: number;
  lastMonthCredit: number;
  lastMonthNet: number;
  lastMonthBalance: number;
  txnCount: number;
}

export interface FinanceCardDrilldownAccount {
  accountId: string;
  accountName: string;
  accountType: string;
  accountNumber?: string;
  bankOrProviderName?: string;
  thisMonthDebit: number;
  thisMonthCredit: number;
  thisMonthAmount: number;
  lastMonthAmount: number;
  lastMonthDebit: number;
  lastMonthCredit: number;
  currentBalance?: number;
  lastMonthBalance?: number;
}

export interface FinanceCardDrilldownTxn {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  description: string;
  amount: number;
  accountName: string;
  type: string;
  isDebit: boolean;
}

export interface FinanceCardDrilldown {
  cardKey: string;
  title: string;
  subtitle: string;
  thisMonthTotal: number;
  lastMonthTotal: number;
  growth: number;
  isRevenueType: boolean;
  byAccount: FinanceCardDrilldownAccount[];
  recentTxns: FinanceCardDrilldownTxn[];
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
    shippingCost?: number;
    marketingCost: number;
    rentCost?: number;
    utilitiesCost?: number;
    softwareCost?: number;
    packagingCost?: number;
    equipmentCost?: number;
    maintenanceCost?: number;
    adminCost?: number;
    otherCost?: number;
    inventoryCost: number;
    totalReceivables: number;
    totalPayables: number;
    totalAccountBalance: number;
    currency: string;
    selectedMonth?: number;
    selectedYear?: number;
    periodLabel?: string;
  };
  growth: {
    revenueGrowth: number;
    expenseGrowth: number;
    grossProfitGrowth: number;
    netProfitGrowth: number;
    cogsChange: number;
  };
  categoryBreakdown?: CategoryExpenseBreakdownItem[];
  accounts: FinanceAccount[];
  recentTransactions: FinanceTransaction[];
  revenueVsExpenseTrend: Array<{
    month: string;
    revenue: number;
    expense: number;
    profit: number;
  }>;
  accountMonthlyBreakdown?: AccountMonthlyBreakdownItem[];
  cardBreakdowns?: Record<string, FinanceCardDrilldown>;
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

export interface RecentMonthSummary {
  month: string;
  monthLabel: string;
  totalVolume: number;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  transactionCount: number;
}

export interface TransactionsResponse extends PaginatedResponse<FinanceTransaction> {
  recentMonthSummary?: RecentMonthSummary;
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
    totalCount?: number;
    paidCount?: number;
    unpaidCount?: number;
    partiallyPaidCount?: number;
    overdueCount?: number;
    allTimeOutstandingCount?: number;
    allTimeOutstandingAmount?: number;
  };
}

export interface BillsResponse extends PaginatedResponse<FinanceBill> {
  summary: {
    totalBilled: number;
    totalPaid: number;
    totalUnpaid: number;
    totalOverdue: number;
    totalCount?: number;
    paidCount?: number;
    unpaidCount?: number;
    partiallyPaidCount?: number;
    overdueCount?: number;
    allTimeOutstandingCount?: number;
    allTimeOutstandingAmount?: number;
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

export type SalaryPaymentStatus = 'UNPAID' | 'PAID';
export type SalaryPaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOBILE_BANKING' | 'CHEQUE';
export type PayrollPaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface SalaryPaymentSummary {
  totalPayrollExpense: number;
  totalSalaryPayable: number;
  totalSalaryPaid: number;
  totalSalaryRemaining: number;
  totalEmployeesPaid: number;
  totalEmployeesUnpaid: number;
  totalApprovedRuns: number;
}

export interface SalaryPaymentRun {
  id: string;
  month: number;
  year: number;
  status: 'DRAFT' | 'FINALIZED' | 'PAID';
  paymentStatus: PayrollPaymentStatus;
  totalGrossAmount: string;
  totalDeductions: string;
  totalNetAmount: string;
  totalPaidAmount: string;
  remainingAmount: string;
  totalEmployees: number;
  paidEmployeesCount: number;
  unpaidEmployeesCount: number;
  finalizedAt?: string;
  approvedByUserId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface SalaryPaymentEmployee {
  payslipId: string;
  employeeId: string;
  employeeCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  departmentName: string;
  designation?: string;
  basicSalary: string;
  houseRentAllowance: string;
  medicalAllowance: string;
  conveyanceAllowance: string;
  otherAllowance: string;
  grossSalary: string;
  providentFundDeduction: string;
  taxDeduction: string;
  totalDeductions: string;
  netSalary: string;
  paidAmount: string;
  paymentStatus: SalaryPaymentStatus;
  paymentMethod?: SalaryPaymentMethod;
  paidAt?: string;
  paidByUserId?: string;
  paymentReference?: string;
}

export interface SalaryPaymentRunDetail {
  run: SalaryPaymentRun;
  employees: SalaryPaymentEmployee[];
}

export interface DisburseSalaryPaymentRequest {
  payslipId: string;
  paymentMethod?: SalaryPaymentMethod;
  accountId?: string;
  paymentDate?: string;
  paymentReference?: string;
}

export interface BulkDisburseSalaryPaymentRequest {
  payrollRunId: string;
  payslipIds?: string[];
  paymentMethod?: SalaryPaymentMethod;
  accountId?: string;
  paymentDate?: string;
  paymentReference?: string;
}

export interface DisburseSalaryPaymentResponse {
  success: boolean;
  message: string;
  disbursedCount: number;
  totalDisbursedAmount: number;
  payrollRunId: string;
  payrollPaymentStatus: PayrollPaymentStatus;
}

export type FinanceRequisitionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type FinanceRequisitionPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface FinanceRequisitionItem {
  productId?: string;
  variantId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface FinanceRequisition {
  id: string;
  tenantId: string;
  storeId: string;
  requisitionNumber: string;
  title: string;
  category: string;
  purchaseOrderId?: string;
  poNumber?: string;
  supplierId?: string;
  supplierName?: string;
  requestedAmount: string;
  requestDate: string;
  requiredDate?: string;
  status: FinanceRequisitionStatus;
  priority: FinanceRequisitionPriority;
  notes?: string;
  items: FinanceRequisitionItem[];
  paidFromAccountId?: string;
  paymentMethod?: string;
  paymentReference?: string;
  disbursedAmount?: string;
  financeTransactionId?: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedByUserId?: string;
  approvedByName?: string;
  createdByUserId?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequisitionStatsSummary {
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  rejectedCount: number;
  totalRequestedCount: number;
  totalRequestedAmount: number;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1` : 'http://localhost:5001/api/v1');

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
    'FinanceSalaryPayments',
    'FinanceRequisitions',
  ],
  endpoints: (builder) => ({
    getFinanceOverview: builder.query<FinanceOverview, { month?: number; year?: number } | void>({
      query: (params) => ({
        url: '/finance/overview',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      providesTags: ['FinanceOverview', 'FinanceTransactions', 'FinanceAccounts'],
    }),

    exportFinanceTransactions: builder.mutation<
      { filename: string; csv: string },
      { month?: number; year?: number; type?: string; categoryCode?: string } | void
    >({
      query: (params) => ({
        url: '/finance/export/transactions',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      providesTags: ['FinanceReports'],
    }),

    getReceivablesReport: builder.query<ReceivablesReport, void>({
      query: () => '/finance/reports/receivables',
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      providesTags: ['FinanceReports', 'FinanceInvoices'],
    }),

    getPayablesReport: builder.query<PayablesReport, void>({
      query: () => '/finance/reports/payables',
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      providesTags: ['FinanceReports', 'FinanceBills'],
    }),

    // Period Closing Locks
    getPeriodLocks: builder.query<FinancePeriodLock[], void>({
      query: () => '/finance/period-locks',
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      TransactionsResponse,
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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

    updateIncome: builder.mutation<
      FinanceTransaction,
      {
        id: string;
        amount?: number;
        categoryCode?: string;
        accountId?: string;
        description?: string;
        reference?: string;
        paymentMethod?: string;
        transactionDate?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/finance/income/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['FinanceIncome', 'FinanceTransactions', 'FinanceOverview', 'FinanceAccounts', 'FinanceReports'],
    }),

    deleteIncome: builder.mutation<void, string>({
      query: (id) => ({
        url: `/finance/income/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FinanceIncome', 'FinanceTransactions', 'FinanceOverview', 'FinanceAccounts', 'FinanceReports'],
    }),

    getExpenses: builder.query<
      ExpensesResponse,
      {
        categoryCode?: string;
        accountId?: string;
        sourceType?: string;
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      providesTags: ['FinanceExpenses', 'FinanceOverview', 'FinanceTransactions'],
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

    updateExpense: builder.mutation<
      FinanceTransaction,
      {
        id: string;
        amount?: number;
        categoryCode?: string;
        accountId?: string;
        description?: string;
        reference?: string;
        paymentMethod?: string;
        transactionDate?: string;
        receiptFileId?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/finance/expenses/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['FinanceExpenses', 'FinanceTransactions', 'FinanceOverview', 'FinanceAccounts', 'FinanceReports'],
    }),

    deleteExpense: builder.mutation<void, string>({
      query: (id) => ({
        url: `/finance/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FinanceExpenses', 'FinanceTransactions', 'FinanceOverview', 'FinanceAccounts', 'FinanceReports'],
    }),

    uploadReceiptFile: builder.mutation<
      { id: string; url: string; fileName: string; mimeType: string },
      { file: File }
    >({
      queryFn: async ({ file }) => {
        try {
          const token =
            typeof window !== 'undefined'
              ? localStorage.getItem('bitcommerce_token')
              : null;
          const storeId =
            typeof window !== 'undefined'
              ? localStorage.getItem('bitcommerce_active_store_id') ||
                localStorage.getItem('bitcommerce_store_id')
              : null;

          const apiBase =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileableType', 'DOCUMENT');
          formData.append(
            'fileType',
            file.type.includes('pdf') ? 'DOCUMENT' : 'IMAGE',
          );

          const headers: HeadersInit = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          if (storeId) {
            headers['x-store-id'] = storeId;
          }

          const response = await fetch(`${apiBase}/files/upload-single`, {
            method: 'POST',
            headers,
            body: formData,
          });

          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            return {
              error: {
                status: response.status,
                data: errBody,
              },
            };
          }

          const body = await response.json();
          const data = body?.data || body;
          return {
            data: {
              id: data.id,
              url: data.url,
              fileName: data.fileName || file.name,
              mimeType: data.mimeType || file.type,
            },
          };
        } catch (err: any) {
          return {
            error: {
              status: 500,
              data: { message: err?.message || 'Failed to upload receipt file' },
            },
          };
        }
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      providesTags: ['FinanceInvoices'],
    }),

    getInvoice: builder.query<FinanceInvoice, string>({
      query: (id) => `/finance/invoices/${id}`,
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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

    updateInvoiceStatus: builder.mutation<
      FinanceInvoice,
      {
        id: string;
        status: FinanceInvoiceStatus;
        accountId?: string;
        paymentMethod?: string;
        paymentDate?: string;
        notes?: string;
        reference?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/finance/invoices/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        'FinanceInvoices',
        'FinanceAccounts',
        'FinanceIncome',
        'FinanceTransactions',
        'FinanceOverview',
        'FinanceReports',
        'FinanceGeneralLedger',
      ],
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      providesTags: ['FinanceBills'],
    }),

    getBill: builder.query<FinanceBill, string>({
      query: (id) => `/finance/bills/${id}`,
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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

    updateBillStatus: builder.mutation<
      FinanceBill,
      {
        id: string;
        status: FinanceBillStatus;
        accountId?: string;
        paymentMethod?: string;
        paymentDate?: string;
        notes?: string;
        reference?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/finance/bills/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        'FinanceBills',
        'FinanceAccounts',
        'FinanceExpenses',
        'FinanceTransactions',
        'FinanceOverview',
        'FinanceReports',
        'FinanceGeneralLedger',
      ],
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
        const payload = response?.data !== undefined ? response.data : response;
        if (Array.isArray(payload)) {
          return {
            items: payload,
            totalBalance: payload.reduce((sum: number, a: any) => sum + Number(a.currentBalance || 0), 0),
          };
        }
        return {
          items: Array.isArray(payload?.items) ? payload.items : [],
          totalBalance: Number(payload?.totalBalance || 0),
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      invalidatesTags: ['FinanceAccounts', 'FinanceOverview'],
    }),

    depositToAccount: builder.mutation<
      { account: FinanceAccount; transaction: FinanceTransaction },
      {
        accountId: string;
        amount: number;
        depositDate?: string;
        source?: string;
        categoryCode?: string;
        reference?: string;
        paymentMethod?: string;
        notes?: string;
      }
    >({
      query: ({ accountId, ...body }) => ({
        url: `/finance/accounts/${accountId}/deposit`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      invalidatesTags: ['FinanceAccounts', 'FinanceOverview', 'FinanceTransactions'],
    }),

    deleteAccount: builder.mutation<{ success: boolean; message: string; deactivated?: boolean }, string>({
      query: (id) => ({
        url: `/finance/accounts/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
    }),

    // Transfers
    getTransfers: builder.query<TransfersResponse, void>({
      query: () => '/finance/transfers',
      transformResponse: (response: any) => {
        const payload = response?.data !== undefined ? response.data : response;
        if (Array.isArray(payload)) {
          return {
            items: payload,
            totalTransferred: payload.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0),
          };
        }
        return {
          items: Array.isArray(payload?.items) ? payload.items : [],
          totalTransferred: Number(payload?.totalTransferred || 0),
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
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      invalidatesTags: ['FinanceTransfers', 'FinanceAccounts', 'FinanceOverview', 'FinanceTransactions', 'FinanceReports'],
    }),

    // Settings & Categories
    getFinanceSettings: builder.query<FinanceSettings, void>({
      query: () => '/finance/settings',
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
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
      transformResponse: (response: any) => {
        const raw = response?.data !== undefined ? response.data : response;
        return Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
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

    // Salary Payments & Disbursements
    getSalaryPaymentSummary: builder.query<SalaryPaymentSummary, { year?: number; month?: number } | void>({
      query: (params) => ({
        url: '/finance/salaries/summary',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const data = response?.data !== undefined ? response.data : response;
        return data || {
          totalPayrollExpense: 0,
          totalSalaryPayable: 0,
          totalSalaryPaid: 0,
          totalSalaryRemaining: 0,
          totalEmployeesPaid: 0,
          totalEmployeesUnpaid: 0,
          totalApprovedRuns: 0,
        };
      },
      providesTags: ['FinanceSalaryPayments', 'FinanceOverview'],
    }),

    getSalaryPaymentRuns: builder.query<SalaryPaymentRun[], { year?: number; month?: number; status?: string } | void>({
      query: (params) => ({
        url: '/finance/salaries/runs',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const data = response?.data !== undefined ? response.data : response;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.items)) return data.items;
        return [];
      },
      providesTags: ['FinanceSalaryPayments'],
    }),

    getSalaryPaymentRunDetail: builder.query<
      SalaryPaymentRunDetail,
      { runId: string; departmentId?: string; paymentStatus?: string; search?: string }
    >({
      query: ({ runId, ...params }) => ({
        url: `/finance/salaries/runs/${runId}/employees`,
        params,
      }),
      transformResponse: (response: any) => {
        const data = response?.data !== undefined ? response.data : response;
        return {
          run: data?.run || null,
          employees: Array.isArray(data?.employees) ? data.employees : [],
        };
      },
      providesTags: ['FinanceSalaryPayments'],
    }),

    disburseSalaryPayment: builder.mutation<DisburseSalaryPaymentResponse, DisburseSalaryPaymentRequest>({
      query: (body) => ({
        url: '/finance/salaries/disburse',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      invalidatesTags: [
        'FinanceSalaryPayments',
        'FinanceTransactions',
        'FinanceAccounts',
        'FinanceOverview',
        'FinanceReports',
        'FinanceExpenses',
      ],
    }),

    disburseSalaryPaymentBulk: builder.mutation<DisburseSalaryPaymentResponse, BulkDisburseSalaryPaymentRequest>({
      query: (body) => ({
        url: '/finance/salaries/disburse-bulk',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        return response?.data !== undefined ? response.data : response;
      },
      invalidatesTags: [
        'FinanceSalaryPayments',
        'FinanceTransactions',
        'FinanceAccounts',
        'FinanceOverview',
        'FinanceReports',
        'FinanceExpenses',
      ],
    }),

    // Requisitions
    getRequisitions: builder.query<
      { items: FinanceRequisition[]; total: number; page: number; limit: number; totalPages: number },
      { search?: string; status?: FinanceRequisitionStatus; page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: '/finance/requisitions',
        params: params || {},
      }),
      transformResponse: (response: any) => (response?.data !== undefined ? response.data : response),
      providesTags: ['FinanceRequisitions'],
    }),

    getRequisitionStats: builder.query<RequisitionStatsSummary, void>({
      query: () => ({ url: '/finance/requisitions/stats' }),
      transformResponse: (response: any) => (response?.data !== undefined ? response.data : response),
      providesTags: ['FinanceRequisitions'],
    }),

    getRequisition: builder.query<FinanceRequisition, string>({
      query: (id) => ({ url: `/finance/requisitions/${id}` }),
      transformResponse: (response: any) => (response?.data !== undefined ? response.data : response),
      providesTags: (_res, _err, id) => [{ type: 'FinanceRequisitions', id }],
    }),

    createRequisition: builder.mutation<
      FinanceRequisition,
      {
        title: string;
        category?: string;
        supplierName?: string;
        supplierId?: string;
        purchaseOrderId?: string;
        poNumber?: string;
        requestedAmount: number;
        requestDate: string;
        requiredDate?: string;
        priority?: FinanceRequisitionPriority;
        notes?: string;
        items?: FinanceRequisitionItem[];
      }
    >({
      query: (body) => ({
        url: '/finance/requisitions',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => (response?.data !== undefined ? response.data : response),
      invalidatesTags: ['FinanceRequisitions'],
    }),

    approveRequisition: builder.mutation<
      FinanceRequisition,
      {
        id: string;
        accountId: string;
        paymentMethod?: string;
        paymentReference?: string;
        notes?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/finance/requisitions/${id}/approve`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => (response?.data !== undefined ? response.data : response),
      invalidatesTags: [
        'FinanceRequisitions',
        'FinanceTransactions',
        'FinanceAccounts',
        'FinanceOverview',
        'FinanceExpenses',
        'FinanceReports',
        'FinanceGeneralLedger',
      ],
    }),

    rejectRequisition: builder.mutation<
      FinanceRequisition,
      {
        id: string;
        reason: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/finance/requisitions/${id}/reject`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => (response?.data !== undefined ? response.data : response),
      invalidatesTags: ['FinanceRequisitions'],
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
  useUpdateIncomeMutation,
  useDeleteIncomeMutation,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useUploadReceiptFileMutation,
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
  useDepositToAccountMutation,
  useDeleteAccountMutation,
  useGetAccountStatementQuery,
  useGetTransfersQuery,
  useCreateTransferMutation,
  useGetFinanceSettingsQuery,
  useUpdateFinanceSettingsMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetSalaryPaymentSummaryQuery,
  useGetSalaryPaymentRunsQuery,
  useGetSalaryPaymentRunDetailQuery,
  useDisburseSalaryPaymentMutation,
  useDisburseSalaryPaymentBulkMutation,
  useExportFinanceTransactionsMutation,
  useGetRequisitionsQuery,
  useGetRequisitionStatsQuery,
  useGetRequisitionQuery,
  useCreateRequisitionMutation,
  useApproveRequisitionMutation,
  useRejectRequisitionMutation,
} = financeApi;
