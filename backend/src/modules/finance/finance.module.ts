import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StaffModule } from '../staff/staff.module';
import { TenantModule } from '../tenant/tenant.module';

import { FinanceAccountEntity } from './entities/finance-account.entity';
import { FinanceCategoryEntity } from './entities/finance-category.entity';
import { FinanceTransactionEntity } from './entities/finance-transaction.entity';
import { FinanceInvoiceEntity } from './entities/finance-invoice.entity';
import { FinanceInvoiceItemEntity } from './entities/finance-invoice-item.entity';
import { FinanceBillEntity } from './entities/finance-bill.entity';
import { FinanceBillItemEntity } from './entities/finance-bill-item.entity';
import { FinanceTransferEntity } from './entities/finance-transfer.entity';
import { FinanceSettingEntity } from './entities/finance-setting.entity';
import { FinanceChartOfAccountEntity } from './entities/finance-chart-of-account.entity';
import { FinanceJournalEntryEntity } from './entities/finance-journal-entry.entity';
import { FinanceJournalLineEntity } from './entities/finance-journal-line.entity';
import { FinancePeriodLockEntity } from './entities/finance-period-lock.entity';
import { InventoryStockEntity } from '../inventory/entities/inventory-stock.entity';
import { ProductEntity } from '../catalog/entities/product.entity';

import { FinanceController } from './finance.controller';

import { RecordSyncedFinanceTransactionService } from './services/record-synced-finance-transaction.service';
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
import { GetTrialBalanceReportService } from './services/get-trial-balance-report.service';
import { GetBalanceSheetReportService } from './services/get-balance-sheet-report.service';
import { GetTaxVatReportService } from './services/get-tax-vat-report.service';
import { SeedDefaultChartOfAccountsService } from './services/seed-default-chart-of-accounts.service';
import { ListChartOfAccountsService } from './services/list-chart-of-accounts.service';
import { CreateChartOfAccountService } from './services/create-chart-of-account.service';
import { UpdateChartOfAccountService } from './services/update-chart-of-account.service';
import { PostJournalEntryService } from './services/post-journal-entry.service';
import { ListJournalEntriesService } from './services/list-journal-entries.service';
import { GetGeneralLedgerService } from './services/get-general-ledger.service';
import { PeriodLockService } from './services/period-lock.service';
import { SyncModuleFinanceService } from './services/sync-module-finance.service';
import {
  GetFinanceSettingsService,
  UpdateFinanceSettingsService,
} from './services/finance-settings.service';
import {
  ListCategoriesService,
  CreateCategoryService,
} from './services/finance-category.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinanceAccountEntity,
      FinanceCategoryEntity,
      FinanceTransactionEntity,
      FinanceInvoiceEntity,
      FinanceInvoiceItemEntity,
      FinanceBillEntity,
      FinanceBillItemEntity,
      FinanceTransferEntity,
      FinanceSettingEntity,
      FinanceChartOfAccountEntity,
      FinanceJournalEntryEntity,
      FinanceJournalLineEntity,
      FinancePeriodLockEntity,
      InventoryStockEntity,
      ProductEntity,
    ]),
    StaffModule,
    TenantModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [FinanceController],
  providers: [
    RecordSyncedFinanceTransactionService,
    GetFinanceOverviewService,
    ListTransactionsService,
    CreateTransactionService,
    DeleteTransactionService,
    ListIncomeService,
    CreateIncomeService,
    ListExpensesService,
    CreateExpenseService,
    ListInvoicesService,
    CreateInvoiceService,
    GetInvoiceService,
    UpdateInvoiceStatusService,
    RecordInvoicePaymentService,
    DeleteInvoiceService,
    ListBillsService,
    CreateBillService,
    GetBillService,
    UpdateBillStatusService,
    RecordBillPaymentService,
    DeleteBillService,
    ListAccountsService,
    CreateAccountService,
    UpdateAccountService,
    GetAccountStatementService,
    ListTransfersService,
    CreateTransferService,
    GetProfitLossReportService,
    GetCashFlowReportService,
    GetReceivablesReportService,
    GetPayablesReportService,
    GetTrialBalanceReportService,
    GetBalanceSheetReportService,
    GetTaxVatReportService,
    SeedDefaultChartOfAccountsService,
    ListChartOfAccountsService,
    CreateChartOfAccountService,
    UpdateChartOfAccountService,
    PostJournalEntryService,
    ListJournalEntriesService,
    GetGeneralLedgerService,
    PeriodLockService,
    SyncModuleFinanceService,
    GetFinanceSettingsService,
    UpdateFinanceSettingsService,
    ListCategoriesService,
    CreateCategoryService,
  ],
  exports: [
    RecordSyncedFinanceTransactionService,
    SyncModuleFinanceService,
    PostJournalEntryService,
    GetFinanceOverviewService,
    GetProfitLossReportService,
  ],
})
export class FinanceModule {}
