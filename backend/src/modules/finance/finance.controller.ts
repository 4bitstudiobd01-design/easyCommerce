import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';

import { GetFinanceOverviewService } from './services/get-finance-overview.service';
import { ListTransactionsService } from './services/list-transactions.service';
import { CreateTransactionService } from './services/create-transaction.service';
import { DeleteTransactionService } from './services/delete-transaction.service';
import { ListIncomeService } from './services/list-income.service';
import { CreateIncomeService } from './services/create-income.service';
import { UpdateIncomeService } from './services/update-income.service';
import { ListExpensesService } from './services/list-expenses.service';
import { CreateExpenseService } from './services/create-expense.service';
import { UpdateExpenseService } from './services/update-expense.service';
import { ListInvoicesService } from './services/list-invoices.service';
import { CreateInvoiceService } from './services/create-invoice.service';
import { GetInvoiceService } from './services/get-invoice.service';
import { UpdateInvoiceStatusService } from './services/update-invoice-status.service';
import { RecordInvoicePaymentService } from './services/record-invoice-payment.service';
import { DeleteInvoiceService } from './services/delete-invoice.service';
import { ListBillsService } from './services/list-bills.service';
import { CreateBillService } from './services/create-bill.service';
import { GetBillService } from './services/get-bill.service';
import { UpdateBillStatusService } from './services/update-bill-status.service';
import { RecordBillPaymentService } from './services/record-bill-payment.service';
import { DeleteBillService } from './services/delete-bill.service';
import { ListAccountsService } from './services/list-accounts.service';
import { CreateAccountService } from './services/create-account.service';
import { UpdateAccountService } from './services/update-account.service';
import { GetAccountStatementService } from './services/get-account-statement.service';
import { DepositToAccountService } from './services/deposit-to-account.service';
import { DeleteAccountService } from './services/delete-account.service';
import { ListTransfersService } from './services/list-transfers.service';
import { CreateTransferService } from './services/create-transfer.service';
import { GetProfitLossReportService } from './services/get-profit-loss-report.service';
import { GetCashFlowReportService } from './services/get-cash-flow-report.service';
import { GetReceivablesReportService } from './services/get-receivables-report.service';
import { GetPayablesReportService } from './services/get-payables-report.service';
import { GetTrialBalanceReportService } from './services/get-trial-balance-report.service';
import { GetBalanceSheetReportService } from './services/get-balance-sheet-report.service';
import { GetTaxVatReportService } from './services/get-tax-vat-report.service';
import { ListChartOfAccountsService } from './services/list-chart-of-accounts.service';
import { CreateChartOfAccountService } from './services/create-chart-of-account.service';
import { UpdateChartOfAccountService } from './services/update-chart-of-account.service';
import { PostJournalEntryService } from './services/post-journal-entry.service';
import { ListJournalEntriesService } from './services/list-journal-entries.service';
import { GetGeneralLedgerService } from './services/get-general-ledger.service';
import { PeriodLockService } from './services/period-lock.service';
import {
  GetFinanceSettingsService,
  UpdateFinanceSettingsService,
} from './services/finance-settings.service';
import {
  ListCategoriesService,
  CreateCategoryService,
} from './services/finance-category.service';
import { GetSalaryPaymentSummaryService } from './services/get-salary-payment-summary.service';
import { ListSalaryPaymentRunsService } from './services/list-salary-payment-runs.service';
import { GetSalaryPaymentRunDetailService } from './services/get-salary-payment-run-detail.service';
import { DisburseSalaryPaymentService } from './services/disburse-salary-payment.service';
import { ExportFinanceDataService, ExportFinanceQueryDto } from './services/export-finance-data.service';

import {
  CreateFinanceAccountDto,
  UpdateFinanceAccountDto,
  DepositToFinanceAccountDto,
} from './dto/account.dto';
import { CreateFinanceCategoryDto } from './dto/category.dto';
import {
  CreateFinanceTransactionDto,
  CreateIncomeDto,
  UpdateIncomeDto,
  CreateExpenseDto,
  UpdateExpenseDto,
} from './dto/transaction.dto';
import {
  CreateFinanceInvoiceDto,
  RecordInvoicePaymentDto,
  UpdateFinanceInvoiceStatusDto,
} from './dto/invoice.dto';
import {
  CreateFinanceBillDto,
  RecordBillPaymentDto,
  UpdateFinanceBillStatusDto,
} from './dto/bill.dto';
import { CreateFinanceTransferDto } from './dto/transfer.dto';
import { UpdateFinanceSettingsDto } from './dto/settings.dto';
import {
  ListTransactionsQueryDto,
  ListInvoicesQueryDto,
  ListBillsQueryDto,
  FinanceReportQueryDto,
} from './dto/finance-query.dto';
import {
  CreateChartOfAccountDto,
  UpdateChartOfAccountDto,
  QueryChartOfAccountsDto,
} from './dto/chart-of-accounts.dto';
import {
  CreateJournalEntryDto,
  QueryJournalEntriesDto,
} from './dto/journal-entry.dto';
import {
  GeneralLedgerQueryDto,
  CreatePeriodLockDto,
  QueryFinancialReportDto,
} from './dto/financial-reports.dto';
import {
  DisburseSalaryPaymentDto,
  BulkDisburseSalaryPaymentDto,
  ListSalaryPaymentRunsQueryDto,
  QuerySalaryPaymentSummaryDto,
  ListSalaryPaymentEmployeesQueryDto,
  SalaryPaymentSummaryResponseDto,
} from './dto/salary-payment.dto';
import {
  FinanceInvoiceStatusEnum,
  FinanceBillStatusEnum,
  FinanceCategoryTypeEnum,
} from './enums/finance.enums';

@ApiTags('Finance')
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly getFinanceOverviewService: GetFinanceOverviewService,
    private readonly listTransactionsService: ListTransactionsService,
    private readonly createTransactionService: CreateTransactionService,
    private readonly deleteTransactionService: DeleteTransactionService,
    private readonly listIncomeService: ListIncomeService,
    private readonly createIncomeService: CreateIncomeService,
    private readonly updateIncomeService: UpdateIncomeService,
    private readonly listExpensesService: ListExpensesService,
    private readonly createExpenseService: CreateExpenseService,
    private readonly updateExpenseService: UpdateExpenseService,
    private readonly listInvoicesService: ListInvoicesService,
    private readonly createInvoiceService: CreateInvoiceService,
    private readonly getInvoiceService: GetInvoiceService,
    private readonly updateInvoiceStatusService: UpdateInvoiceStatusService,
    private readonly recordInvoicePaymentService: RecordInvoicePaymentService,
    private readonly deleteInvoiceService: DeleteInvoiceService,
    private readonly listBillsService: ListBillsService,
    private readonly createBillService: CreateBillService,
    private readonly getBillService: GetBillService,
    private readonly updateBillStatusService: UpdateBillStatusService,
    private readonly recordBillPaymentService: RecordBillPaymentService,
    private readonly deleteBillService: DeleteBillService,
    private readonly listAccountsService: ListAccountsService,
    private readonly createAccountService: CreateAccountService,
    private readonly updateAccountService: UpdateAccountService,
    private readonly getAccountStatementService: GetAccountStatementService,
    private readonly depositToAccountService: DepositToAccountService,
    private readonly deleteAccountService: DeleteAccountService,
    private readonly listTransfersService: ListTransfersService,
    private readonly createTransferService: CreateTransferService,
    private readonly getProfitLossReportService: GetProfitLossReportService,
    private readonly getCashFlowReportService: GetCashFlowReportService,
    private readonly getReceivablesReportService: GetReceivablesReportService,
    private readonly getPayablesReportService: GetPayablesReportService,
    private readonly getTrialBalanceReportService: GetTrialBalanceReportService,
    private readonly getBalanceSheetReportService: GetBalanceSheetReportService,
    private readonly getTaxVatReportService: GetTaxVatReportService,
    private readonly listChartOfAccountsService: ListChartOfAccountsService,
    private readonly createChartOfAccountService: CreateChartOfAccountService,
    private readonly updateChartOfAccountService: UpdateChartOfAccountService,
    private readonly postJournalEntryService: PostJournalEntryService,
    private readonly listJournalEntriesService: ListJournalEntriesService,
    private readonly getGeneralLedgerService: GetGeneralLedgerService,
    private readonly periodLockService: PeriodLockService,
    private readonly getFinanceSettingsService: GetFinanceSettingsService,
    private readonly updateFinanceSettingsService: UpdateFinanceSettingsService,
    private readonly listCategoriesService: ListCategoriesService,
    private readonly createCategoryService: CreateCategoryService,
    private readonly getSalaryPaymentSummaryService: GetSalaryPaymentSummaryService,
    private readonly listSalaryPaymentRunsService: ListSalaryPaymentRunsService,
    private readonly getSalaryPaymentRunDetailService: GetSalaryPaymentRunDetailService,
    private readonly disburseSalaryPaymentService: DisburseSalaryPaymentService,
    private readonly exportFinanceDataService: ExportFinanceDataService,
  ) {}

  private async getStoreContext(userId: string, headerStoreId?: string) {
    const store = await this.findStoreByUserService.execute(userId, headerStoreId);
    if (!store) {
      throw new BadRequestException('Store context could not be resolved for this merchant.');
    }
    return store;
  }

  // ─── 1. OVERVIEW & EXPORT ───────────────────────────────────────
  @Get('overview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Get finance overview summary, dynamic monthly calculations, and trends' })
  async getOverview(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getFinanceOverviewService.execute(store.tenantId, store.id, {
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
    });
  }

  @Get('export/transactions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Export financial transactions to Google Sheets/Excel compatible CSV' })
  async exportTransactions(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('type') type?: string,
    @Query('categoryCode') categoryCode?: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.exportFinanceDataService.generateTransactionsCsv(store.id, {
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      type,
      categoryCode,
    });
  }

  // ─── 2. CHART OF ACCOUNTS ───────────────────────────────────────
  @Get('chart-of-accounts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List Chart of Accounts' })
  async listChartOfAccounts(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: QueryChartOfAccountsDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listChartOfAccountsService.execute(store.tenantId, store.id, query);
  }

  @Post('chart-of-accounts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:accounts:manage', 'finance:manage')
  @ApiOperation({ summary: 'Create custom Chart of Account' })
  async createChartOfAccount(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateChartOfAccountDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createChartOfAccountService.execute(store.tenantId, store.id, dto);
  }

  @Patch('chart-of-accounts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:accounts:manage', 'finance:manage')
  @ApiOperation({ summary: 'Update Chart of Account' })
  async updateChartOfAccount(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChartOfAccountDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateChartOfAccountService.execute(store.id, id, dto);
  }

  // ─── 3. JOURNAL ENTRIES & DOUBLE-ENTRY LEDGER ───────────────────
  @Get('journal-entries')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List Journal Entries' })
  async listJournalEntries(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: QueryJournalEntriesDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listJournalEntriesService.execute(store.id, query);
  }

  @Post('journal-entries')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Post a manual balanced Double-Entry Journal Entry' })
  async postJournalEntry(
    @CurrentUser('sub') userId: string,
    @CurrentUser('name') userName: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateJournalEntryDto,
    @Req() req: any,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.postJournalEntryService.execute(
      store.tenantId,
      store.id,
      dto,
      {
        userId,
        userName,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    );
  }

  @Get('general-ledger')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Get General Ledger statement for an account' })
  async getGeneralLedger(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: GeneralLedgerQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getGeneralLedgerService.execute(store.id, query);
  }

  // ─── 4. TRANSACTIONS ───────────────────────────────────────────
  @Get('transactions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List all finance transactions with filters' })
  async listTransactions(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListTransactionsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listTransactionsService.execute(store.id, query);
  }

  @Post('transactions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Create manual transaction' })
  async createTransaction(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateFinanceTransactionDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createTransactionService.execute(store.tenantId, store.id, userId, dto);
  }

  @Delete('transactions/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Delete or void a transaction' })
  async deleteTransaction(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.deleteTransactionService.execute(store.id, id);
  }

  // ─── 5. INCOME & EXPENSES ──────────────────────────────────────
  @Get('income')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List income transactions and revenue breakdowns' })
  async listIncome(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListTransactionsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listIncomeService.execute(store.id, query);
  }

  @Post('income')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Record manual income transaction' })
  async createIncome(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateIncomeDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createIncomeService.execute(store.tenantId, store.id, userId, dto);
  }

  @Patch('income/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Update manual income transaction' })
  async updateIncome(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateIncomeService.execute(store.id, id, userId, dto);
  }

  @Delete('income/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Delete income transaction' })
  async deleteIncome(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.deleteTransactionService.execute(store.id, id, userId);
  }

  @Get('expenses')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List expenses and category breakdowns' })
  async listExpenses(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListTransactionsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listExpensesService.execute(store.tenantId, store.id, query);
  }

  @Post('expenses')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Record business expense' })
  async createExpense(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createExpenseService.execute(store.tenantId, store.id, userId, dto);
  }

  @Patch('expenses/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Update business expense' })
  async updateExpense(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateExpenseService.execute(store.id, id, userId, dto);
  }

  @Delete('expenses/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Delete business expense' })
  async deleteExpense(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.deleteTransactionService.execute(store.id, id, userId);
  }

  // ─── 6. INVOICES ───────────────────────────────────────────────
  @Get('invoices')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List invoices with pagination & status filter' })
  async listInvoices(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListInvoicesQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listInvoicesService.execute(store.id, query);
  }

  @Post('invoices')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:invoices:manage', 'finance:manage')
  @ApiOperation({ summary: 'Create a new invoice' })
  async createInvoice(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateFinanceInvoiceDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createInvoiceService.execute(store.tenantId, store.id, userId, dto);
  }

  @Get('invoices/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Get invoice details' })
  async getInvoice(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getInvoiceService.execute(store.id, id);
  }

  @Patch('invoices/:id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:invoices:manage', 'finance:manage')
  @ApiOperation({ summary: 'Update invoice status' })
  async updateInvoiceStatus(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFinanceInvoiceStatusDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateInvoiceStatusService.execute(store.id, id, userId, dto);
  }

  @Post('invoices/:id/payments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:invoices:manage', 'finance:manage')
  @ApiOperation({ summary: 'Record payment against an invoice' })
  async recordInvoicePayment(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: RecordInvoicePaymentDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.recordInvoicePaymentService.execute(store.id, id, userId, dto);
  }

  @Delete('invoices/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:invoices:manage', 'finance:manage')
  @ApiOperation({ summary: 'Delete invoice (if unpaid)' })
  async deleteInvoice(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.deleteInvoiceService.execute(store.id, id);
  }

  // ─── 7. BILLS ──────────────────────────────────────────────────
  @Get('bills')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List vendor bills' })
  async listBills(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListBillsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listBillsService.execute(store.id, query);
  }

  @Post('bills')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:bills:manage', 'finance:manage')
  @ApiOperation({ summary: 'Create vendor bill' })
  async createBill(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateFinanceBillDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createBillService.execute(store.tenantId, store.id, userId, dto);
  }

  @Get('bills/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Get bill details' })
  async getBill(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getBillService.execute(store.id, id);
  }

  @Patch('bills/:id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:bills:manage', 'finance:manage')
  @ApiOperation({ summary: 'Update bill status' })
  async updateBillStatus(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFinanceBillStatusDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateBillStatusService.execute(store.id, id, userId, dto);
  }

  @Post('bills/:id/payments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:bills:manage', 'finance:manage')
  @ApiOperation({ summary: 'Record payment for a bill' })
  async recordBillPayment(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: RecordBillPaymentDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.recordBillPaymentService.execute(store.id, id, userId, dto);
  }

  @Delete('bills/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:bills:manage', 'finance:manage')
  @ApiOperation({ summary: 'Delete bill (if unpaid)' })
  async deleteBill(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.deleteBillService.execute(store.id, id);
  }

  // ─── 8. ACCOUNTS & TRANSFERS ───────────────────────────────────
  @Get('accounts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List payment & bank accounts' })
  async listAccounts(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listAccountsService.execute(store.id);
  }

  @Post('accounts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:accounts:manage', 'finance:manage')
  @ApiOperation({ summary: 'Create new bank or payment account' })
  async createAccount(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateFinanceAccountDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createAccountService.execute(store.tenantId, store.id, dto);
  }

  @Patch('accounts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:accounts:manage', 'finance:manage')
  @ApiOperation({ summary: 'Update financial account details' })
  async updateAccount(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFinanceAccountDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateAccountService.execute(store.id, id, dto);
  }

  @Post('accounts/:id/deposit')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:accounts:manage', 'finance:manage')
  @ApiOperation({ summary: 'Deposit money into a financial account' })
  async depositToAccount(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: DepositToFinanceAccountDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.depositToAccountService.execute(store.tenantId, store.id, userId, id, dto);
  }

  @Delete('accounts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:accounts:manage', 'finance:manage')
  @ApiOperation({ summary: 'Delete or deactivate financial account' })
  async deleteAccount(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.deleteAccountService.execute(store.id, id);
  }

  @Get('accounts/:id/statement')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Get account statement with transaction ledger' })
  async getAccountStatement(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getAccountStatementService.execute(store.id, id);
  }

  @Get('transfers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List fund transfers between accounts' })
  async listTransfers(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listTransfersService.execute(store.id);
  }

  @Post('transfers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transfers:manage', 'finance:manage')
  @ApiOperation({ summary: 'Transfer funds between financial accounts' })
  async createTransfer(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateFinanceTransferDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createTransferService.execute(store.tenantId, store.id, userId, dto);
  }

  // ─── 9. REPORTS ─────────────────────────────────────────────────
  @Get('reports/profit-loss')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:reports:read', 'finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Profit and Loss (P&L) Report with period comparison' })
  async getProfitLossReport(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: QueryFinancialReportDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getProfitLossReportService.execute(store.id, query);
  }

  @Get('reports/balance-sheet')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:reports:read', 'finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Balance Sheet statement' })
  async getBalanceSheetReport(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: QueryFinancialReportDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getBalanceSheetReportService.execute(store.tenantId, store.id, query);
  }

  @Get('reports/trial-balance')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:reports:read', 'finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Trial Balance report' })
  async getTrialBalanceReport(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: QueryFinancialReportDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getTrialBalanceReportService.execute(store.tenantId, store.id, query);
  }

  @Get('reports/cash-flow')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:reports:read', 'finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Cash Flow Report' })
  async getCashFlowReport(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: QueryFinancialReportDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getCashFlowReportService.execute(store.id, query);
  }

  @Get('reports/tax-vat')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:reports:read', 'finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Tax and VAT filing summary report' })
  async getTaxVatReport(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: QueryFinancialReportDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getTaxVatReportService.execute(store.id, query);
  }

  @Get('reports/receivables')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:reports:read', 'finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Accounts Receivable Aging Report' })
  async getReceivablesReport(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getReceivablesReportService.execute(store.id);
  }

  @Get('reports/payables')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:reports:read', 'finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Accounts Payable Aging Report' })
  async getPayablesReport(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getPayablesReportService.execute(store.id);
  }

  // ─── 10. PERIOD CLOSING & LOCKS ────────────────────────────────
  @Get('period-locks')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:settings:manage', 'finance:manage')
  @ApiOperation({ summary: 'List closed and locked accounting periods' })
  async listPeriodLocks(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.periodLockService.list(store.id);
  }

  @Post('period-locks')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:settings:manage', 'finance:manage')
  @ApiOperation({ summary: 'Lock an accounting period' })
  async lockPeriod(
    @CurrentUser('sub') userId: string,
    @CurrentUser('name') userName: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreatePeriodLockDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.periodLockService.lockPeriod(store.tenantId, store.id, userId, userName, dto);
  }

  @Patch('period-locks/:id/unlock')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:settings:manage', 'finance:manage')
  @ApiOperation({ summary: 'Unlock an accounting period' })
  async unlockPeriod(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.periodLockService.unlockPeriod(store.id, id);
  }

  // ─── 11. SETTINGS & CATEGORIES ─────────────────────────────────
  @Get('settings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Get finance settings' })
  async getSettings(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getFinanceSettingsService.execute(store.tenantId, store.id);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:settings:manage', 'finance:manage')
  @ApiOperation({ summary: 'Update finance settings' })
  async updateSettings(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: UpdateFinanceSettingsDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateFinanceSettingsService.execute(store.tenantId, store.id, dto);
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List finance categories' })
  async listCategories(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query('type') type?: FinanceCategoryTypeEnum,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listCategoriesService.execute(store.tenantId, store.id, type);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:settings:manage', 'finance:manage')
  @ApiOperation({ summary: 'Create custom finance category' })
  async createCategory(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateFinanceCategoryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createCategoryService.execute(store.tenantId, store.id, dto);
  }

  // ─── 11. SALARY PAYMENTS & DISBURSEMENTS ────────────────────────
  @Get('salaries/summary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Get overall and month-wise salary payments summary KPIs' })
  @ApiResponse({ status: 200, type: SalaryPaymentSummaryResponseDto })
  async getSalaryPaymentSummary(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: QuerySalaryPaymentSummaryDto,
  ): Promise<SalaryPaymentSummaryResponseDto> {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getSalaryPaymentSummaryService.execute(store.id, query);
  }

  @Get('salaries/runs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List approved payroll runs for salary payments' })
  async listSalaryPaymentRuns(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListSalaryPaymentRunsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listSalaryPaymentRunsService.execute(store.id, query);
  }

  @Get('salaries/runs/:id/employees')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Get employee payslip disbursement list for a payroll run' })
  async getSalaryPaymentRunDetail(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') runId: string,
    @Query() query: ListSalaryPaymentEmployeesQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getSalaryPaymentRunDetailService.execute(store.id, runId, query);
  }

  @Post('salaries/disburse')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Disburse cash payment for a single employee payslip' })
  async disburseSingleSalary(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: DisburseSalaryPaymentDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.disburseSalaryPaymentService.disburseSingle(store.tenantId, store.id, userId, dto);
  }

  @Post('salaries/disburse-bulk')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Bulk disburse cash payments for multiple or all unpaid employees in a run' })
  async disburseBulkSalary(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: BulkDisburseSalaryPaymentDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.disburseSalaryPaymentService.disburseBulk(store.tenantId, store.id, userId, dto);
  }
}
