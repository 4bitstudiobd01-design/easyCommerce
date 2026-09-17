import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountEntity } from './entities/account.entity';
import { JournalEntryEntity } from './entities/journal-entry.entity';
import { JournalLineEntity } from './entities/journal-line.entity';
import { ExpenseEntity } from './entities/expense.entity';
import { AccountingSettingsEntity } from './entities/accounting-settings.entity';
import { AccountMappingEntity } from './entities/account-mapping.entity';
import { NumberingRuleEntity } from './entities/numbering-rule.entity';
import { TenantModule } from '../tenant/tenant.module';
import { StaffModule } from '../staff/staff.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountingController } from './accounting.controller';
import { GetAccountingSettingsService } from './services/get-accounting-settings.service';
import { UpdateAccountingSettingsService } from './services/update-accounting-settings.service';
import { SeedDefaultChartOfAccountsService } from './services/seed-default-chart-of-accounts.service';
import { AllocateNextNumberService } from './services/allocate-next-number.service';
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

/**
 * Accounting — double-entry ledger for a merchant store.
 *
 * Depends on TenantModule (store resolution) and StaffModule (GetMyPermissionsService,
 * which PermissionsGuard uses to resolve the caller's accounting:* permissions), mirroring
 * how HrmModule is wired.
 *
 * PostJournalEntryService and AllocateNextNumberService are exported so other slices
 * (expenses today; order/payment settlement later) can post balanced entries through the
 * one write path instead of touching the ledger tables directly.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountEntity,
      JournalEntryEntity,
      JournalLineEntity,
      ExpenseEntity,
      AccountingSettingsEntity,
      AccountMappingEntity,
      NumberingRuleEntity,
    ]),
    TenantModule,
    StaffModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [AccountingController],
  providers: [
    GetAccountingSettingsService,
    UpdateAccountingSettingsService,
    SeedDefaultChartOfAccountsService,
    AllocateNextNumberService,
    ListAccountsService,
    GetAccountTreeService,
    CreateAccountService,
    UpdateAccountService,
    DeleteAccountService,
    PostJournalEntryService,
    ListJournalEntriesService,
    GetJournalEntryService,
    VoidJournalEntryService,
    PostDraftJournalEntryService,
    GetJournalEntryStatsService,
    GetAccountLedgerService,
    GetProfitLossReportService,
    GetBalanceSheetReportService,
    CreateExpenseService,
    UpdateExpenseService,
    DeleteExpenseService,
    ListExpensesService,
    GetExpenseStatsService,
    GetAccountingOverviewService,
    ListAccountMappingsService,
    UpdateAccountMappingService,
    ListNumberingRulesService,
    UpdateNumberingRuleService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [PostJournalEntryService, AllocateNextNumberService, ListAccountsService],
})
export class AccountingModule {}
