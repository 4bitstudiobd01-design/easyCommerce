import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';

// ─── Shared domain types (mirror backend/src/modules/accounting/entities) ──────

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';
export type JournalStatus = 'DRAFT' | 'POSTED' | 'VOID';
export type JournalSource =
  | 'MANUAL'
  | 'EXPENSE'
  | 'ORDER'
  | 'PAYMENT'
  | 'INVENTORY'
  | 'OPENING_BALANCE'
  | 'PURCHASE'
  | 'SUPPLIER_PAYMENT';
export type ExpensePaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'CHEQUE'
  | 'MOBILE_BANKING';
export type ExpenseStatus = 'PAID' | 'DUE';
export type AccountMappingEvent =
  | 'SALES_REVENUE'
  | 'SHIPPING_INCOME'
  | 'COURIER_COST'
  | 'PAYMENT_GATEWAY_FEE'
  | 'SALES_RETURNS'
  | 'COGS'
  | 'INVENTORY_ASSET'
  | 'ACCOUNTS_RECEIVABLE'
  | 'ACCOUNTS_PAYABLE'
  | 'CASH'
  | 'BANK'
  | 'TAX_PAYABLE';
export type NumberingDocType = 'JOURNAL_ENTRY' | 'EXPENSE' | 'DEBIT_NOTE' | 'CREDIT_NOTE';

export interface Account {
  id: string;
  tenantId: string;
  storeId: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentId?: string | null;
  description?: string;
  openingBalance: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalLine {
  id: string;
  storeId: string;
  journalEntryId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  memo?: string;
  lineOrder: number;
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  storeId: string;
  entryNumber: string;
  date: string;
  description: string;
  reference?: string;
  status: JournalStatus;
  source: JournalSource;
  sourceRef?: string;
  totalDebit: string;
  totalCredit: string;
  createdByUserId?: string;
  postedAt?: string;
  lines: JournalLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedJournalEntries {
  items: JournalEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface JournalEntryStats {
  totalEntries: number;
  postedEntries: number;
  draftEntries: number;
  totalAmount: string;
}

export interface AccountingSettings {
  id: string;
  tenantId: string;
  storeId: string;
  fiscalYearStartMonth: number;
  baseCurrency: string;
  autoPostEnabled: boolean;
  allowDraftEntries: boolean;
  chartSeeded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountMapping {
  id: string;
  tenantId: string;
  storeId: string;
  event: AccountMappingEvent;
  accountId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NumberingRule {
  id: string;
  tenantId: string;
  storeId: string;
  docType: NumberingDocType;
  prefix: string;
  suffix: string;
  includeYear: boolean;
  padWidth: number;
  nextSequence: number;
  createdAt: string;
  updatedAt: string;
  sample: string;
}

// ─── Request shapes ──────────────────────────────────────────────────────────

export interface JournalLineInput {
  accountId: string;
  debit?: number;
  credit?: number;
  memo?: string;
}

export interface CreateJournalEntryRequest {
  date: string;
  description: string;
  reference?: string;
  status?: 'POSTED' | 'DRAFT';
  lines: JournalLineInput[];
}

export interface ListJournalEntriesParams {
  search?: string;
  status?: JournalStatus;
  accountId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface UpdateAccountingSettingsRequest {
  fiscalYearStartMonth?: number;
  autoPostEnabled?: boolean;
  allowDraftEntries?: boolean;
}

export interface UpdateAccountMappingRequest {
  event: AccountMappingEvent;
  accountId: string | null;
}

export interface UpdateNumberingRuleRequest {
  docType: NumberingDocType;
  prefix?: string;
  suffix?: string;
  includeYear?: boolean;
  padWidth?: number;
  nextSequence?: number;
}

/** An account enriched with its posted-ledger running totals, as returned by the tree endpoint. */
export interface AccountWithBalances extends Account {
  totalDebit: string;
  totalCredit: string;
  closingBalance: string;
}

export interface AccountTreeGroup {
  type: AccountType;
  label: string;
  accounts: AccountWithBalances[];
}

export interface CreateAccountRequest {
  code: string;
  name: string;
  type: AccountType;
  normalBalance?: NormalBalance;
  parentId?: string;
  description?: string;
  openingBalance?: number;
}

export interface UpdateAccountRequest {
  id: string;
  name?: string;
  description?: string;
  parentId?: string | null;
  openingBalance?: number;
  isActive?: boolean;
}

// ─── Ledger ──────────────────────────────────────────────────────────────────

export interface LedgerRow {
  date: string;
  entryId: string;
  entryNumber: string;
  description: string;
  memo: string | null;
  debit: string;
  credit: string;
  runningBalance: string;
}

export interface AccountLedger {
  account: {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    normalBalance: NormalBalance;
  };
  from: string | null;
  to: string | null;
  openingBalance: string;
  closingBalance: string;
  totalDebit: string;
  totalCredit: string;
  rows: LedgerRow[];
}

export interface LedgerParams {
  accountId: string;
  from?: string;
  to?: string;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface ReportLine {
  accountId: string;
  code: string;
  name: string;
  amount: string;
}

export interface ProfitLossReport {
  period: { from: string; to: string };
  /** Echoes the branchId filter that produced this report, when one was applied. */
  branchId?: string;
  revenue: { total: string; lines: ReportLine[] };
  cogs: { total: string; lines: ReportLine[] };
  grossProfit: string;
  operatingExpenses: { total: string; lines: ReportLine[] };
  netProfit: string;
  netMarginPct: string;
}

export interface BalanceSheetReport {
  asOf: string;
  assets: { total: string; lines: ReportLine[] };
  liabilities: { total: string; lines: ReportLine[] };
  equity: { total: string; lines: ReportLine[]; retainedEarningsToDate: string };
  liabilitiesAndEquity: string;
  isBalanced: boolean;
  difference: string;
}

export interface ProfitLossParams {
  from?: string;
  to?: string;
  /** Optional branch filter — when provided, only that branch's journal lines are
   *  aggregated. Omitted = full store aggregate (unchanged default behaviour). */
  branchId?: string;
}

// ─── Overview ────────────────────────────────────────────────────────────────

export interface AccountingOverviewPeriod {
  from: string;
  to: string;
}

export interface AccountingOverviewKpis {
  totalRevenue: string;
  totalExpenses: string;
  netProfit: string;
  cashBalance: string;
}

export interface AccountingOverviewComparison {
  previousPeriod: AccountingOverviewPeriod;
  revenueChangePct: string;
  expensesChangePct: string;
  netProfitChangePct: string;
}

export interface AccountingOverviewTrendPoint {
  date: string;
  revenue: string;
  expenses: string;
}

export interface AccountingOverviewOutstandingLine {
  amount: string;
  accountCount: number;
}

export interface AccountingOverviewRecentTransaction {
  id: string;
  date: string;
  description: string;
  account: string;
  type: 'Income' | 'Expense';
  amount: string;
  status: string;
}

export interface AccountingOverview {
  period: AccountingOverviewPeriod;
  kpis: AccountingOverviewKpis;
  comparison: AccountingOverviewComparison;
  trend: AccountingOverviewTrendPoint[];
  outstanding: {
    accountsReceivable: AccountingOverviewOutstandingLine;
    accountsPayable: AccountingOverviewOutstandingLine;
  };
  recentTransactions: AccountingOverviewRecentTransaction[];
}

export interface AccountingOverviewParams {
  from?: string;
  to?: string;
}

export interface BalanceSheetParams {
  asOf?: string;
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  tenantId: string;
  storeId: string;
  expenseNumber: string;
  date: string;
  title: string;
  note?: string;
  category: string;
  vendor?: string;
  amount: string;
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  expenseAccountId?: string | null;
  paidFromAccountId?: string | null;
  journalEntryId?: string | null;
  receiptUrl?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedExpenses {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
}

export interface ExpenseStats {
  totalExpenses: string;
  totalPaid: string;
  totalDue: string;
  avgPerDay: string;
}

export interface CreateExpenseRequest {
  date: string;
  title: string;
  note?: string;
  category: string;
  vendor?: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  expenseAccountId?: string;
  paidFromAccountId?: string;
}

export interface UpdateExpenseRequest {
  id: string;
  title?: string;
  note?: string;
  category?: string;
  vendor?: string;
  receiptUrl?: string;
}

export interface ListExpensesParams {
  search?: string;
  category?: string;
  paymentMethod?: ExpensePaymentMethod;
  status?: ExpenseStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

// ─── API definition ──────────────────────────────────────────────────────────

/** Backend envelopes successful responses as `{ data: T }`; unwrap it here. */
const unwrap = <T,>(response: { data: T } | T): T =>
  (response as { data: T })?.data !== undefined
    ? (response as { data: T }).data
    : (response as T);

export const accountingApi = createApi({
  reducerPath: 'accountingApi',
  baseQuery: createBaseQueryWithReauth(
    process.env.NEXT_PUBLIC_API_URL?.replace('/orders', '') || 'http://localhost:5001/api/v1',
  ),
  tagTypes: [
    'Account',
    'JournalEntry',
    'Expense',
    'Ledger',
    'Report',
    'AccountingSettings',
    'AccountMapping',
    'NumberingRule',
    'AccountingOverview',
  ],
  endpoints: (builder) => ({
    // ── Overview ──────────────────────────────────────────────────
    getAccountingOverview: builder.query<AccountingOverview, AccountingOverviewParams | void>({
      query: (params) => ({ url: '/accounting/overview', params: params || undefined }),
      providesTags: ['AccountingOverview'],
      transformResponse: unwrap<AccountingOverview>,
    }),

    // ── Settings ──────────────────────────────────────────────────
    getAccountingSettings: builder.query<AccountingSettings, void>({
      query: () => '/accounting/settings',
      providesTags: ['AccountingSettings'],
      transformResponse: unwrap<AccountingSettings>,
    }),
    updateAccountingSettings: builder.mutation<AccountingSettings, UpdateAccountingSettingsRequest>({
      query: (body) => ({ url: '/accounting/settings', method: 'PATCH', body }),
      invalidatesTags: ['AccountingSettings'],
      transformResponse: unwrap<AccountingSettings>,
    }),

    // ── Settings: account mapping ────────────────────────────────
    getAccountMappings: builder.query<AccountMapping[], void>({
      query: () => '/accounting/settings/mappings',
      providesTags: ['AccountMapping'],
      transformResponse: unwrap<AccountMapping[]>,
    }),
    updateAccountMapping: builder.mutation<AccountMapping, UpdateAccountMappingRequest>({
      query: (body) => ({ url: '/accounting/settings/mappings', method: 'PATCH', body }),
      invalidatesTags: ['AccountMapping'],
      transformResponse: unwrap<AccountMapping>,
    }),

    // ── Settings: document numbering ─────────────────────────────
    getNumberingRules: builder.query<NumberingRule[], void>({
      query: () => '/accounting/settings/numbering',
      providesTags: ['NumberingRule'],
      transformResponse: unwrap<NumberingRule[]>,
    }),
    updateNumberingRule: builder.mutation<NumberingRule, UpdateNumberingRuleRequest>({
      query: (body) => ({ url: '/accounting/settings/numbering', method: 'PATCH', body }),
      invalidatesTags: ['NumberingRule'],
      transformResponse: unwrap<NumberingRule>,
    }),

    // ── Accounts (read) — full CRUD is added by the Chart of Accounts slice ──
    getAccounts: builder.query<Account[], { activeOnly?: boolean } | void>({
      query: (params) => ({
        url: '/accounting/accounts',
        params: params?.activeOnly ? { activeOnly: 'true' } : undefined,
      }),
      providesTags: ['Account'],
      transformResponse: unwrap<Account[]>,
    }),

    getAccountTree: builder.query<AccountTreeGroup[], void>({
      query: () => '/accounting/accounts/tree',
      providesTags: ['Account'],
      transformResponse: unwrap<AccountTreeGroup[]>,
    }),
    createAccount: builder.mutation<Account, CreateAccountRequest>({
      query: (body) => ({ url: '/accounting/accounts', method: 'POST', body }),
      invalidatesTags: ['Account', 'Report', 'AccountingOverview'],
      transformResponse: unwrap<Account>,
    }),
    updateAccount: builder.mutation<Account, UpdateAccountRequest>({
      query: ({ id, ...patch }) => ({
        url: `/accounting/accounts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Account', 'Report', 'AccountingOverview'],
      transformResponse: unwrap<Account>,
    }),
    deleteAccount: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/accounting/accounts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Account', 'Report', 'AccountingOverview'],
      transformResponse: unwrap<{ success: boolean; message: string }>,
    }),

    // ── Journal entries ──────────────────────────────────────────
    getJournalEntries: builder.query<PaginatedJournalEntries, ListJournalEntriesParams | void>({
      query: (params) => ({ url: '/accounting/journal-entries', params: params || undefined }),
      providesTags: ['JournalEntry'],
      transformResponse: unwrap<PaginatedJournalEntries>,
    }),
    createJournalEntry: builder.mutation<JournalEntry, CreateJournalEntryRequest>({
      query: (body) => ({ url: '/accounting/journal-entries', method: 'POST', body }),
      invalidatesTags: ['JournalEntry', 'Ledger', 'Report', 'AccountingOverview', 'Account'],
      transformResponse: unwrap<JournalEntry>,
    }),
    getJournalEntry: builder.query<JournalEntry, string>({
      query: (id) => `/accounting/journal-entries/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'JournalEntry', id }],
      transformResponse: unwrap<JournalEntry>,
    }),
    getJournalEntryStats: builder.query<JournalEntryStats, void>({
      query: () => '/accounting/journal-entries/stats',
      providesTags: ['JournalEntry'],
      transformResponse: unwrap<JournalEntryStats>,
    }),
    postJournalEntry: builder.mutation<JournalEntry, string>({
      query: (id) => ({ url: `/accounting/journal-entries/${id}/post`, method: 'POST' }),
      invalidatesTags: ['JournalEntry', 'Ledger', 'Report', 'AccountingOverview', 'Account'],
      transformResponse: unwrap<JournalEntry>,
    }),
    voidJournalEntry: builder.mutation<JournalEntry, string>({
      query: (id) => ({ url: `/accounting/journal-entries/${id}/void`, method: 'POST' }),
      invalidatesTags: ['JournalEntry', 'Ledger', 'Report', 'AccountingOverview', 'Account'],
      transformResponse: unwrap<JournalEntry>,
    }),

    // ── Ledger ───────────────────────────────────────────────────
    getAccountLedger: builder.query<AccountLedger, LedgerParams>({
      query: (params) => ({ url: '/accounting/ledger', params }),
      providesTags: ['Ledger'],
      transformResponse: unwrap<AccountLedger>,
    }),

    // ── Reports ──────────────────────────────────────────────────
    getProfitLossReport: builder.query<ProfitLossReport, ProfitLossParams | void>({
      query: (params) => ({
        url: '/accounting/reports/profit-loss',
        params: params || undefined,
      }),
      providesTags: ['Report'],
      transformResponse: unwrap<ProfitLossReport>,
    }),
    getBalanceSheetReport: builder.query<BalanceSheetReport, BalanceSheetParams | void>({
      query: (params) => ({
        url: '/accounting/reports/balance-sheet',
        params: params || undefined,
      }),
      providesTags: ['Report'],
      transformResponse: unwrap<BalanceSheetReport>,
    }),

    // ── Expenses ─────────────────────────────────────────────────
    getExpenses: builder.query<PaginatedExpenses, ListExpensesParams | void>({
      query: (params) => ({ url: '/accounting/expenses', params: params || undefined }),
      providesTags: ['Expense'],
      transformResponse: unwrap<PaginatedExpenses>,
    }),
    getExpenseStats: builder.query<ExpenseStats, void>({
      query: () => '/accounting/expenses/stats',
      providesTags: ['Expense'],
      transformResponse: unwrap<ExpenseStats>,
    }),
    createExpense: builder.mutation<Expense, CreateExpenseRequest>({
      query: (body) => ({ url: '/accounting/expenses', method: 'POST', body }),
      invalidatesTags: ['Expense', 'JournalEntry', 'Ledger', 'Report', 'AccountingOverview', 'Account'],
      transformResponse: unwrap<Expense>,
    }),
    updateExpense: builder.mutation<Expense, UpdateExpenseRequest>({
      query: ({ id, ...patch }) => ({
        url: `/accounting/expenses/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Expense'],
      transformResponse: unwrap<Expense>,
    }),
    deleteExpense: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/accounting/expenses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Expense', 'JournalEntry', 'Ledger', 'Report', 'AccountingOverview', 'Account'],
      transformResponse: unwrap<{ success: boolean; message: string }>,
    }),
  }),
});

export const {
  useGetAccountingOverviewQuery,
  useGetAccountingSettingsQuery,
  useUpdateAccountingSettingsMutation,
  useGetAccountMappingsQuery,
  useUpdateAccountMappingMutation,
  useGetNumberingRulesQuery,
  useUpdateNumberingRuleMutation,
  useGetAccountsQuery,
  useGetAccountTreeQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useGetJournalEntriesQuery,
  useCreateJournalEntryMutation,
  useGetJournalEntryQuery,
  useGetJournalEntryStatsQuery,
  usePostJournalEntryMutation,
  useVoidJournalEntryMutation,
  useGetAccountLedgerQuery,
  useGetProfitLossReportQuery,
  useGetBalanceSheetReportQuery,
  useGetExpensesQuery,
  useGetExpenseStatsQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = accountingApi;
