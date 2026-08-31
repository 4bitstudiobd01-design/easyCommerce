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
    GetFinanceSettingsService,
    UpdateFinanceSettingsService,
    ListCategoriesService,
    CreateCategoryService,
  ],
  exports: [
    RecordSyncedFinanceTransactionService,
    GetFinanceOverviewService,
    GetProfitLossReportService,
  ],
})
export class FinanceModule {}
