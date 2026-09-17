import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { StoreEntity } from '../tenant/entities/store.entity';
import { GetAccountingSettingsService } from './services/get-accounting-settings.service';
import { UpdateAccountingSettingsService } from './services/update-accounting-settings.service';
import { SeedDefaultChartOfAccountsService } from './services/seed-default-chart-of-accounts.service';
import { ListAccountsService } from './services/list-accounts.service';
import { GetAccountTreeService } from './services/get-account-tree.service';
import { CreateAccountService } from './services/create-account.service';
import { UpdateAccountService } from './services/update-account.service';
import { DeleteAccountService } from './services/delete-account.service';
import { PostJournalEntryService } from './services/post-journal-entry.service';
import { ListJournalEntriesService } from './services/list-journal-entries.service';
import { GetJournalEntryService } from './services/get-journal-entry.service';
import { VoidJournalEntryService } from './services/void-journal-entry.service';
import { PostDraftJournalEntryService } from './services/post-draft-journal-entry.service';
import { GetJournalEntryStatsService } from './services/get-journal-entry-stats.service';
import { GetAccountLedgerService } from './services/get-account-ledger.service';
import { GetProfitLossReportService } from './services/get-profit-loss-report.service';
import { GetBalanceSheetReportService } from './services/get-balance-sheet-report.service';
import { CreateExpenseService } from './services/create-expense.service';
import { UpdateExpenseService } from './services/update-expense.service';
import { DeleteExpenseService } from './services/delete-expense.service';
import { ListExpensesService } from './services/list-expenses.service';
import { GetExpenseStatsService } from './services/get-expense-stats.service';
import { GetAccountingOverviewService } from './services/get-accounting-overview.service';
import { ListAccountMappingsService } from './services/list-account-mappings.service';
import { UpdateAccountMappingService } from './services/update-account-mapping.service';
import { ListNumberingRulesService } from './services/list-numbering-rules.service';
import { UpdateNumberingRuleService } from './services/update-numbering-rule.service';
import { CreateJournalEntryDto, ListJournalEntriesQueryDto } from './dto/journal-entry.dto';
import { LedgerQueryDto } from './dto/ledger.dto';
import { CreateExpenseDto, UpdateExpenseDto, ListExpensesQueryDto } from './dto/expense.dto';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { ProfitLossQueryDto, BalanceSheetQueryDto } from './dto/report.dto';
import { AccountingOverviewQueryDto } from './dto/overview.dto';
import {
  UpdateAccountingSettingsDto,
  UpdateAccountMappingDto,
  UpdateNumberingRuleDto,
} from './dto/settings.dto';

/**
 * Merchant-facing accounting API. Mounted at /api/v1/accounting.
 *
 * Every handler resolves the active store through `getStoreContext`, which also lazily
 * seeds the default chart of accounts the first time this module is touched for a store.
 * Per-page slices (chart of accounts, expenses, ledger, reports, settings) add their
 * handlers to this controller.
 */
@ApiTags('Accounting')
@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly getAccountingSettingsService: GetAccountingSettingsService,
    private readonly updateAccountingSettingsService: UpdateAccountingSettingsService,
    private readonly seedDefaultChartOfAccountsService: SeedDefaultChartOfAccountsService,
    private readonly listAccountsService: ListAccountsService,
    private readonly getAccountTreeService: GetAccountTreeService,
    private readonly createAccountService: CreateAccountService,
    private readonly updateAccountService: UpdateAccountService,
    private readonly deleteAccountService: DeleteAccountService,
    private readonly postJournalEntryService: PostJournalEntryService,
    private readonly listJournalEntriesService: ListJournalEntriesService,
    private readonly getJournalEntryService: GetJournalEntryService,
    private readonly voidJournalEntryService: VoidJournalEntryService,
    private readonly postDraftJournalEntryService: PostDraftJournalEntryService,
    private readonly getJournalEntryStatsService: GetJournalEntryStatsService,
    private readonly getAccountLedgerService: GetAccountLedgerService,
    private readonly getProfitLossReportService: GetProfitLossReportService,
    private readonly getBalanceSheetReportService: GetBalanceSheetReportService,
    private readonly createExpenseService: CreateExpenseService,
    private readonly updateExpenseService: UpdateExpenseService,
    private readonly deleteExpenseService: DeleteExpenseService,
    private readonly listExpensesService: ListExpensesService,
    private readonly getExpenseStatsService: GetExpenseStatsService,
    private readonly getAccountingOverviewService: GetAccountingOverviewService,
    private readonly listAccountMappingsService: ListAccountMappingsService,
    private readonly updateAccountMappingService: UpdateAccountMappingService,
    private readonly listNumberingRulesService: ListNumberingRulesService,
    private readonly updateNumberingRuleService: UpdateNumberingRuleService,
  ) {}

  /**
   * Resolves the store the caller is acting on and guarantees the accounting settings row
   * and default chart of accounts exist for it. Every handler calls this first.
   */
  private async getStoreContext(userId: string, storeIdHeader?: string): Promise<StoreEntity> {
    const store = await this.findStoreByUserService.execute(userId, storeIdHeader);
    if (!store) {
      throw new BadRequestException('Merchant store context not found.');
    }
    const settings = await this.getAccountingSettingsService.execute(store.tenantId, store.id);
    if (!settings.chartSeeded) {
      await this.seedDefaultChartOfAccountsService.execute(store.tenantId, store.id);
    }
    return store;
  }

  // ─── Settings ───────────────────────────────────────────────────

  @Get('settings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage', 'accounting:settings:manage')
  @ApiOperation({ summary: 'Get accounting settings for the active store' })
  @ApiResponse({ status: 200, description: 'Accounting settings' })
  async getSettings(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getAccountingSettingsService.execute(store.tenantId, store.id);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:settings:manage', 'accounting:manage')
  @ApiOperation({ summary: 'Update accounting general settings' })
  @ApiResponse({ status: 200, description: 'Updated accounting settings' })
  async updateSettings(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: UpdateAccountingSettingsDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateAccountingSettingsService.execute(store.tenantId, store.id, dto);
  }

  @Get('settings/mappings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage', 'accounting:settings:manage')
  @ApiOperation({ summary: 'List automation → GL account mappings for the active store' })
  @ApiResponse({ status: 200, description: 'All twelve account-mapping rows' })
  async listAccountMappings(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listAccountMappingsService.execute(store.id);
  }

  @Patch('settings/mappings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:settings:manage', 'accounting:manage')
  @ApiOperation({ summary: 'Set the GL account one automation event posts to' })
  @ApiResponse({ status: 200, description: 'The updated mapping row' })
  async updateAccountMapping(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: UpdateAccountMappingDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateAccountMappingService.execute(store.tenantId, store.id, dto);
  }

  @Get('settings/numbering')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage', 'accounting:settings:manage')
  @ApiOperation({ summary: 'List document numbering rules for the active store' })
  @ApiResponse({ status: 200, description: 'All four numbering rules with a sample preview' })
  async listNumberingRules(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listNumberingRulesService.execute(store.tenantId, store.id);
  }

  @Patch('settings/numbering')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:settings:manage', 'accounting:manage')
  @ApiOperation({ summary: 'Update a document numbering rule (prefix / suffix / year / pad / next sequence)' })
  @ApiResponse({ status: 200, description: 'The updated rule with a recomputed sample preview' })
  async updateNumberingRule(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: UpdateNumberingRuleDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateNumberingRuleService.execute(store.tenantId, store.id, dto);
  }

  // ─── Overview ───────────────────────────────────────────────────

  @Get('overview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage')
  @ApiOperation({
    summary: 'Accounting overview for the landing page (KPIs, comparison, trend, outstanding, recent activity)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Flow KPIs vs the prior period, revenue/expense trend, outstanding AR/AP and the latest posted transactions (POSTED only)',
  })
  async getAccountingOverview(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() q: AccountingOverviewQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getAccountingOverviewService.execute(store.tenantId, store.id, q);
  }

  // ─── Accounts (read) ────────────────────────────────────────────

  @Get('accounts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage')
  @ApiOperation({ summary: 'List chart-of-accounts entries for the active store' })
  @ApiResponse({ status: 200, description: 'Flat, code-ordered list of accounts' })
  async listAccounts(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listAccountsService.execute(store.id, { activeOnly: activeOnly === 'true' });
  }

  @Get('accounts/tree')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage')
  @ApiOperation({ summary: 'Chart of accounts grouped by type, with posted balances' })
  @ApiResponse({ status: 200, description: 'Account groups with per-account debit/credit/closing totals' })
  async getAccountTree(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getAccountTreeService.execute(store.id);
  }

  @Post('accounts')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:manage')
  @ApiOperation({ summary: 'Create a chart-of-accounts entry' })
  @ApiResponse({ status: 201, description: 'The created account' })
  async createAccount(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateAccountDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createAccountService.execute(store.tenantId, store.id, dto);
  }

  @Patch('accounts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:manage')
  @ApiOperation({ summary: 'Update a chart-of-accounts entry (code and type are immutable)' })
  @ApiResponse({ status: 200, description: 'The updated account' })
  async updateAccount(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') accountId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateAccountService.execute(store.id, accountId, dto);
  }

  @Delete('accounts/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:manage')
  @ApiOperation({ summary: 'Delete a chart-of-accounts entry (system/posted accounts cannot be deleted)' })
  @ApiResponse({ status: 200, description: 'Deletion result' })
  async deleteAccount(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') accountId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.deleteAccountService.execute(store.id, accountId);
  }

  // ─── Journal entries ────────────────────────────────────────────

  @Get('journal-entries')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage')
  @ApiOperation({ summary: 'Paginated, filterable list of journal entries' })
  @ApiResponse({ status: 200, description: 'Paginated journal entries with their lines' })
  async listJournalEntries(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListJournalEntriesQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listJournalEntriesService.execute(store.id, query);
  }

  @Post('journal-entries')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:manage')
  @ApiOperation({ summary: 'Create a manual journal entry (balanced double-entry)' })
  @ApiResponse({ status: 201, description: 'The posted or drafted journal entry' })
  async createJournalEntry(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateJournalEntryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.postJournalEntryService.execute(store.tenantId, store.id, {
      date: dto.date,
      description: dto.description,
      reference: dto.reference,
      status: dto.status,
      lines: dto.lines,
      createdByUserId: userId,
    });
  }

  @Get('journal-entries/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage')
  @ApiOperation({ summary: 'KPI totals for journal entries in the current month' })
  @ApiResponse({ status: 200, description: 'Total/posted/draft counts and posted amount' })
  async getJournalEntryStats(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getJournalEntryStatsService.execute(store.id);
  }

  @Get('journal-entries/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage')
  @ApiOperation({ summary: 'Get a single journal entry with its lines' })
  @ApiResponse({ status: 200, description: 'The journal entry' })
  async getJournalEntry(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getJournalEntryService.execute(store.id, id);
  }

  @Post('journal-entries/:id/post')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:manage')
  @ApiOperation({ summary: 'Post a draft journal entry (revalidates balance)' })
  @ApiResponse({ status: 201, description: 'The posted journal entry' })
  async postDraftJournalEntry(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.postDraftJournalEntryService.execute(store.id, id, userId);
  }

  @Post('journal-entries/:id/void')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:manage')
  @ApiOperation({ summary: 'Void a posted or draft journal entry (kept for audit)' })
  @ApiResponse({ status: 201, description: 'The voided journal entry' })
  async voidJournalEntry(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.voidJournalEntryService.execute(store.id, id, userId);
  }

  // ─── Ledger ─────────────────────────────────────────────────────

  @Get('ledger')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage')
  @ApiOperation({ summary: 'General ledger for one account over an optional date window (POSTED only)' })
  @ApiResponse({ status: 200, description: 'Opening/closing balance, in-range rows with running balance, and totals' })
  async getAccountLedger(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: LedgerQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getAccountLedgerService.execute(store.id, query);
  }

  // ─── Reports ────────────────────────────────────────────────────

  @Get('reports/profit-loss')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage')
  @ApiOperation({
    summary: 'Profit & Loss statement over a date range (POSTED only, movement only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue, COGS, gross profit, operating expenses, net profit and net margin',
  })
  async getProfitLossReport(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() q: ProfitLossQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getProfitLossReportService.execute(store.tenantId, store.id, q);
  }

  @Get('reports/balance-sheet')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage')
  @ApiOperation({
    summary: 'Balance Sheet at a point in time (POSTED only, cumulative through asOf)',
  })
  @ApiResponse({
    status: 200,
    description: 'Assets, liabilities, equity (incl. retained earnings to date) and balance check',
  })
  async getBalanceSheetReport(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() q: BalanceSheetQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getBalanceSheetReportService.execute(store.tenantId, store.id, q);
  }

  // ─── Expenses ───────────────────────────────────────────────────

  @Get('expenses/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage')
  @ApiOperation({ summary: 'KPI totals for expenses in the current month' })
  @ApiResponse({ status: 200, description: 'Total / paid / due / average-per-day figures' })
  async getExpenseStats(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.getExpenseStatsService.execute(store.id);
  }

  @Get('expenses')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:read', 'accounting:manage')
  @ApiOperation({ summary: 'Paginated, filterable list of expenses' })
  @ApiResponse({ status: 200, description: 'Paginated expenses' })
  async listExpenses(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Query() query: ListExpensesQueryDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listExpensesService.execute(store.id, query);
  }

  @Post('expenses')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:manage')
  @ApiOperation({ summary: 'Record an expense and post its balanced journal entry' })
  @ApiResponse({ status: 201, description: 'The created expense with its journal entry id' })
  async createExpense(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createExpenseService.execute(store.tenantId, store.id, dto, userId);
  }

  @Patch('expenses/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:manage')
  @ApiOperation({ summary: 'Update an expense (metadata-only once it is booked)' })
  @ApiResponse({ status: 200, description: 'The updated expense' })
  async updateExpense(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.updateExpenseService.execute(store.id, id, dto, userId);
  }

  @Delete('expenses/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('accounting:manage')
  @ApiOperation({ summary: 'Delete an expense and void its linked journal entry' })
  @ApiResponse({ status: 200, description: 'Deletion result' })
  async deleteExpense(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') id: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.deleteExpenseService.execute(store.id, id, userId);
  }
}
