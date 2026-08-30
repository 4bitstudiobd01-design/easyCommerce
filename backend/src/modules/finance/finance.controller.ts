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
import { ListExpensesService } from './services/list-expenses.service';
import { CreateExpenseService } from './services/create-expense.service';
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
import { ListTransfersService } from './services/list-transfers.service';
import { CreateTransferService } from './services/create-transfer.service';
import { GetProfitLossReportService } from './services/get-profit-loss-report.service';
import { GetCashFlowReportService } from './services/get-cash-flow-report.service';
import { GetReceivablesReportService } from './services/get-receivables-report.service';
import { GetPayablesReportService } from './services/get-payables-report.service';
import {
  GetFinanceSettingsService,
  UpdateFinanceSettingsService,
} from './services/finance-settings.service';
import {
  ListCategoriesService,
  CreateCategoryService,
} from './services/finance-category.service';

import { CreateFinanceAccountDto, UpdateFinanceAccountDto } from './dto/account.dto';
import { CreateFinanceCategoryDto } from './dto/category.dto';
import {
  CreateFinanceTransactionDto,
  CreateIncomeDto,
  CreateExpenseDto,
} from './dto/transaction.dto';
import {
  CreateFinanceInvoiceDto,
  RecordInvoicePaymentDto,
} from './dto/invoice.dto';
import {
  CreateFinanceBillDto,
  RecordBillPaymentDto,
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
    private readonly listExpensesService: ListExpensesService,
    private readonly createExpenseService: CreateExpenseService,
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
    private readonly listTransfersService: ListTransfersService,
    private readonly createTransferService: CreateTransferService,
    private readonly getProfitLossReportService: GetProfitLossReportService,
    private readonly getCashFlowReportService: GetCashFlowReportService,
    private readonly getReceivablesReportService: GetReceivablesReportService,
    private readonly getPayablesReportService: GetPayablesReportService,
    private readonly getFinanceSettingsService: GetFinanceSettingsService,
    private readonly updateFinanceSettingsService: UpdateFinanceSettingsService,
    private readonly listCategoriesService: ListCategoriesService,
    private readonly createCategoryService: CreateCategoryService,
  ) {}

  private async getStoreContext(userId: string, storeIdHeader?: string) {
    const store = await this.findStoreByUserService.execute(userId, storeIdHeader);
    if (!store) {
      throw new BadRequestException('Merchant store context not found.');
    }
    return store;
  }

  // ─── 1. OVERVIEW ────────────────────────────────────────────────
  @Get('overview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Get finance overview KPIs and trend chart' })
  async getOverview(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getFinanceOverviewService.execute(store.id);
  }

  // ─── 2. TRANSACTIONS ───────────────────────────────────────────
  @Get('transactions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List financial transactions with filters' })
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
  @ApiOperation({ summary: 'Delete transaction' })
  async deleteTransaction(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    await this.deleteTransactionService.execute(store.id, id);
    return { success: true, message: 'Transaction deleted successfully.' };
  }

  // ─── 3. INCOME ──────────────────────────────────────────────────
  @Get('income')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List income streams and totals' })
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
  @ApiOperation({ summary: 'Record manual income' })
  async createIncome(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateIncomeDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createIncomeService.execute(store.tenantId, store.id, userId, dto);
  }

  // ─── 4. EXPENSES ────────────────────────────────────────────────
  @Get('expenses')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List expenses and category breakdown' })
  async listExpenses(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListTransactionsQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listExpensesService.execute(store.id, query);
  }

  @Post('expenses')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:transactions:manage', 'finance:manage')
  @ApiOperation({ summary: 'Record manual expense' })
  async createExpense(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createExpenseService.execute(store.tenantId, store.id, userId, dto);
  }

  // ─── 5. INVOICES ────────────────────────────────────────────────
  @Get('invoices')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List customer invoices' })
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
  @ApiOperation({ summary: 'Create customer invoice' })
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
    @Body('status') status: FinanceInvoiceStatusEnum,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateInvoiceStatusService.execute(store.id, id, status);
  }

  @Post('invoices/:id/payments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:invoices:manage', 'finance:manage')
  @ApiOperation({ summary: 'Record payment against invoice' })
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
  @ApiOperation({ summary: 'Delete invoice' })
  async deleteInvoice(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    await this.deleteInvoiceService.execute(store.id, id);
    return { success: true, message: 'Invoice deleted successfully.' };
  }

  // ─── 6. BILLS ───────────────────────────────────────────────────
  @Get('bills')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List supplier bills' })
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
  @ApiOperation({ summary: 'Create supplier bill' })
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
    @Body('status') status: FinanceBillStatusEnum,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateBillStatusService.execute(store.id, id, status);
  }

  @Post('bills/:id/payments')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:bills:manage', 'finance:manage')
  @ApiOperation({ summary: 'Record payment against bill' })
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
  @ApiOperation({ summary: 'Delete bill' })
  async deleteBill(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    await this.deleteBillService.execute(store.id, id);
    return { success: true, message: 'Bill deleted successfully.' };
  }

  // ─── 7. ACCOUNTS ────────────────────────────────────────────────
  @Get('accounts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List financial accounts' })
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
  @ApiOperation({ summary: 'Create financial account' })
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
  @ApiOperation({ summary: 'Update financial account' })
  async updateAccount(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFinanceAccountDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateAccountService.execute(store.id, id, dto);
  }

  @Get('accounts/:id/statement')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Get account statement and transaction history' })
  async getAccountStatement(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getAccountStatementService.execute(store.id, id);
  }

  // ─── 8. TRANSFERS ───────────────────────────────────────────────
  @Get('transfers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:read', 'finance:manage')
  @ApiOperation({ summary: 'List account transfers' })
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
  @ApiOperation({ summary: 'Profit and Loss (P&L) Report' })
  async getProfitLossReport(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: FinanceReportQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getProfitLossReportService.execute(store.id, query);
  }

  @Get('reports/cash-flow')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('finance:reports:read', 'finance:read', 'finance:manage')
  @ApiOperation({ summary: 'Cash Flow Report' })
  async getCashFlowReport(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: FinanceReportQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getCashFlowReportService.execute(store.id, query);
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

  // ─── 10. SETTINGS & CATEGORIES ─────────────────────────────────
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
}
