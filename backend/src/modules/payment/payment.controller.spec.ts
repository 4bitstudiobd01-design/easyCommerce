import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { OrderEntity } from '../order/entities/order.entity';
import { NotificationDispatcherService } from '../sms/services/notification-dispatcher.service';
import { GetMyPermissionsService } from '../staff/services/get-my-permissions.service';
import { InitiateSslCommerzPaymentService } from './services/initiate-sslcommerz-payment.service';
import { ValidateSslCommerzPaymentService } from './services/validate-sslcommerz-payment.service';
import { ListMerchantPaymentsService } from './services/list-merchant-payments.service';
import { ListPaymentTransactionsService } from './services/list-payment-transactions.service';
import { GetPaymentSummaryService } from './services/get-payment-summary.service';
import { GetPaymentDetailsService } from './services/get-payment-details.service';
import { ListPaymentGatewaysService } from './services/list-payment-gateways.service';
import { ExportPaymentTransactionsService } from './services/export-payment-transactions.service';
import { GetOrderBalanceService } from './services/get-order-balance.service';
import { GetOrderPaymentHistoryService } from './services/get-order-payment-history.service';
import { RecordManualPaymentService } from './services/record-manual-payment.service';
import { VoidManualPaymentService } from './services/void-manual-payment.service';
import { CreatePaymentLinkForOrderService } from './services/create-payment-link-for-order.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let findStore: { execute: jest.Mock };
  let listTransactions: { execute: jest.Mock };
  let getSummary: { execute: jest.Mock };
  let getDetails: { execute: jest.Mock };
  let exportTransactions: { execute: jest.Mock };

  beforeEach(async () => {
    findStore = { execute: jest.fn().mockResolvedValue({ tenantId: 'tenant-a', slug: 'demo' }) };
    listTransactions = {
      execute: jest.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
    };
    getSummary = { execute: jest.fn().mockResolvedValue({}) };
    getDetails = { execute: jest.fn().mockResolvedValue({}) };
    exportTransactions = {
      execute: jest.fn().mockResolvedValue({
        filename: 'payment-transactions-2025-08-14.csv',
        content: 'Transaction\n',
        rowCount: 1,
        truncated: false,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: InitiateSslCommerzPaymentService, useValue: { execute: jest.fn() } },
        { provide: ValidateSslCommerzPaymentService, useValue: { execute: jest.fn() } },
        { provide: ListMerchantPaymentsService, useValue: { execute: jest.fn() } },
        { provide: ListPaymentTransactionsService, useValue: listTransactions },
        { provide: GetPaymentSummaryService, useValue: getSummary },
        { provide: GetPaymentDetailsService, useValue: getDetails },
        { provide: ListPaymentGatewaysService, useValue: { execute: jest.fn().mockResolvedValue([]) } },
        { provide: ExportPaymentTransactionsService, useValue: exportTransactions },
        { provide: GetOrderBalanceService, useValue: { execute: jest.fn() } },
        { provide: GetOrderPaymentHistoryService, useValue: { execute: jest.fn() } },
        { provide: RecordManualPaymentService, useValue: { execute: jest.fn() } },
        { provide: VoidManualPaymentService, useValue: { execute: jest.fn() } },
        { provide: CreatePaymentLinkForOrderService, useValue: { execute: jest.fn() } },
        { provide: NotificationDispatcherService, useValue: { dispatch: jest.fn() } },
        { provide: getRepositoryToken(OrderEntity), useValue: { findOne: jest.fn() } },
        { provide: FindStoreByUserService, useValue: findStore },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        // Guard collaborators — their presence here confirms JwtAuthGuard and
        // PermissionsGuard are genuinely attached to these routes.
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        {
          provide: GetMyPermissionsService,
          useValue: { execute: jest.fn().mockResolvedValue({ permissions: [], isOwner: true }) },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('resolves the tenant from the authenticated user before listing transactions', async () => {
    await controller.listPaymentTransactions('user-1', { page: 1 }, 'store-1');

    expect(findStore.execute).toHaveBeenCalledWith('user-1', 'store-1');
    // The tenant comes from the server-side store lookup, never from the client.
    expect(listTransactions.execute).toHaveBeenCalledWith('tenant-a', { page: 1 });
  });

  it('refuses to list transactions when the user has no store', async () => {
    findStore.execute.mockResolvedValue(null);

    await expect(controller.listPaymentTransactions('user-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(listTransactions.execute).not.toHaveBeenCalled();
  });

  it('scopes the summary to the resolved tenant', async () => {
    await controller.getPaymentSummary('user-1', { dateRange: undefined }, 'store-1');

    expect(getSummary.execute).toHaveBeenCalledWith('tenant-a', { dateRange: undefined });
  });

  it('scopes payment details to the resolved tenant', async () => {
    await controller.getPaymentDetails('user-1', 'pay-1', 'store-1');

    expect(getDetails.execute).toHaveBeenCalledWith('tenant-a', 'pay-1');
  });

  it('streams the export as a CSV attachment carrying the active filters', async () => {
    const res: any = { setHeader: jest.fn(), send: jest.fn() };

    await controller.exportPaymentTransactions('user-1', { status: undefined }, res, 'store-1');

    expect(exportTransactions.execute).toHaveBeenCalledWith('tenant-a', { status: undefined });
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="payment-transactions-2025-08-14.csv"',
    );
    expect(res.send).toHaveBeenCalledWith('Transaction\n');
  });
});
