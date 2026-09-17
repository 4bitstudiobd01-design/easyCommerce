import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GetPaymentDetailsService } from './get-payment-details.service';
import { RecordPaymentEventService } from './record-payment-event.service';
import { ExportPaymentTransactionsService } from './export-payment-transactions.service';
import { ListPaymentTransactionsService } from './list-payment-transactions.service';
import { PaymentDomainService } from './payment-domain.service';
import {
  PaymentEntity,
  PaymentTransactionStatusEnum,
} from '../entities/payment.entity';
import { RefundEntity } from '../entities/refund.entity';
import { PaymentEventEntity } from '../entities/payment-event.entity';
import { PaymentGatewayEntity } from '../entities/payment-gateway.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { PaymentEventTypeEnum } from '../enums/payment-event-type.enum';
import { PaymentGatewayEnum } from '../enums/payment-gateway.enum';
import { PaymentMethodTypeEnum } from '../enums/payment-method.enum';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { PERMISSIONS_KEY } from '../../../common/decorators/require-permissions.decorator';

describe('Payment security and edge cases', () => {
  describe('Tenant isolation — GetPaymentDetailsService', () => {
    let service: GetPaymentDetailsService;
    let paymentRepo: any;

    beforeEach(async () => {
      paymentRepo = { findOne: jest.fn() };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          GetPaymentDetailsService,
          PaymentDomainService,
          { provide: getRepositoryToken(PaymentEntity), useValue: paymentRepo },
          { provide: getRepositoryToken(RefundEntity), useValue: { find: jest.fn().mockResolvedValue([]) } },
          { provide: getRepositoryToken(PaymentEventEntity), useValue: { find: jest.fn().mockResolvedValue([]) } },
          { provide: getRepositoryToken(OrderEntity), useValue: { findOne: jest.fn().mockResolvedValue(null) } },
        ],
      }).compile();

      service = module.get<GetPaymentDetailsService>(GetPaymentDetailsService);
    });

    it('includes tenantId in the lookup so Merchant A cannot read Merchant B payments', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(service.execute('tenant-a', 'payment-owned-by-tenant-b')).rejects.toThrow(
        NotFoundException,
      );

      expect(paymentRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'payment-owned-by-tenant-b', tenantId: 'tenant-a' },
      });
    });

    it('reports a foreign payment as not-found, never as forbidden, to avoid leaking existence', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(service.execute('tenant-a', 'foreign-payment')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('Webhook idempotency — RecordPaymentEventService', () => {
    let service: RecordPaymentEventService;
    let eventRepo: any;

    beforeEach(async () => {
      eventRepo = {
        create: jest.fn((v) => v),
        save: jest.fn(),
        findOne: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RecordPaymentEventService,
          { provide: getRepositoryToken(PaymentEventEntity), useValue: eventRepo },
        ],
      }).compile();

      service = module.get<RecordPaymentEventService>(RecordPaymentEventService);
    });

    it('swallows a replayed gateway event instead of duplicating it', async () => {
      // Postgres unique-violation on (paymentId, externalEventId).
      eventRepo.save.mockRejectedValue({ code: '23505' });

      const result = await service.execute({
        tenantId: 'tenant-a',
        paymentId: 'pay-1',
        type: PaymentEventTypeEnum.WEBHOOK_RECEIVED,
        externalEventId: 'val-123',
      });

      expect(result).toBeNull();
    });

    it('reports an already-applied event so callers skip duplicate side effects', async () => {
      eventRepo.findOne.mockResolvedValue({ id: 'existing-event' });

      await expect(service.hasProcessed('pay-1', 'val-123')).resolves.toBe(true);
      expect(eventRepo.findOne).toHaveBeenCalledWith({
        where: { paymentId: 'pay-1', externalEventId: 'val-123' },
        select: ['id'],
      });
    });

    it('rethrows unrelated database failures rather than hiding them', async () => {
      eventRepo.save.mockRejectedValue({ code: '08006', message: 'connection failure' });

      await expect(
        service.execute({
          tenantId: 'tenant-a',
          paymentId: 'pay-1',
          type: PaymentEventTypeEnum.WEBHOOK_RECEIVED,
          externalEventId: 'val-123',
        }),
      ).rejects.toBeDefined();
    });
  });

  describe('Export scoping — ExportPaymentTransactionsService', () => {
    let service: ExportPaymentTransactionsService;
    let qb: any;

    beforeEach(async () => {
      qb = {
        recorded: { where: [], andWhere: [] },
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn(function (...a: any[]) {
          qb.recorded.where.push(a);
          return qb;
        }),
        andWhere: jest.fn(function (...a: any[]) {
          qb.recorded.andWhere.push(a);
          return qb;
        }),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [
            {
              id: 'p1',
              orderId: 'o1',
              orderNumber: 'EC-1024',
              transactionNumber: 'TXN-10245',
              tranId: 'SSLCZ-8F92A1B3C4',
              amount: 4500,
              refundedAmount: 0,
              currency: 'BDT',
              gateway: PaymentGatewayEnum.SSLCOMMERZ,
              paymentMethod: PaymentMethodTypeEnum.BKASH,
              status: PaymentTransactionStatusEnum.COMPLETED,
              createdAt: new Date('2025-08-14T04:46:00.000Z'),
            },
          ],
          raw: [{ customerName: '=cmd|calc', customerPhone: '+8801712345678' }],
        }),
      };

      const paymentRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ExportPaymentTransactionsService,
          ListPaymentTransactionsService,
          PaymentDomainService,
          { provide: getRepositoryToken(PaymentEntity), useValue: paymentRepo },
        ],
      }).compile();

      service = module.get<ExportPaymentTransactionsService>(ExportPaymentTransactionsService);
    });

    it('scopes the export to the tenant and the active filters', async () => {
      await service.execute('tenant-a', { status: PaymentTransactionStatusEnum.COMPLETED });

      expect(qb.recorded.where).toContainEqual([
        'payment.tenantId = :tenantId',
        { tenantId: 'tenant-a' },
      ]);
      expect(JSON.stringify(qb.recorded.andWhere)).toContain('payment.status = :status');
    });

    it('neutralises spreadsheet formula injection from customer-supplied text', async () => {
      const result = await service.execute('tenant-a', {});

      // A name beginning with "=" must not execute when opened in Excel.
      expect(result.content).toContain(`"'=cmd|calc"`);
      expect(result.content).not.toContain(`"=cmd|calc"`);
    });

    it('exports masked gateway references, never the raw credential', async () => {
      const result = await service.execute('tenant-a', {});

      expect(result.content).toContain('SSLCZ-8F92...');
      expect(result.content).not.toContain('SSLCZ-8F92A1B3C4');
    });

    it('caps the export size and flags truncation', async () => {
      qb.getCount.mockResolvedValue(50000);

      const result = await service.execute('tenant-a', {});

      expect(qb.limit).toHaveBeenCalledWith(10000);
      expect(result.truncated).toBe(true);
    });
  });

  describe('Authorization — PermissionsGuard on payment routes', () => {
    let guard: PermissionsGuard;
    let getMyPermissions: any;
    let reflector: Reflector;

    const makeContext = (userId?: string) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ user: userId ? { sub: userId } : undefined, headers: {} }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      }) as any;

    beforeEach(async () => {
      getMyPermissions = { execute: jest.fn() };
      reflector = new Reflector();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PermissionsGuard,
          { provide: Reflector, useValue: reflector },
          {
            provide: 'GetMyPermissionsService',
            useValue: getMyPermissions,
          },
        ],
      })
        .overrideProvider(PermissionsGuard)
        .useFactory({
          factory: () => new PermissionsGuard(reflector, getMyPermissions),
        })
        .compile();

      guard = module.get<PermissionsGuard>(PermissionsGuard);
    });

    it('rejects an unauthenticated caller requesting the transaction list', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['orders:read']);

      await expect(guard.canActivate(makeContext(undefined))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('rejects a staff member without orders:read from listing transactions', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['orders:read']);
      getMyPermissions.execute.mockResolvedValue({
        permissions: ['products:read'],
        isOwner: false,
      });

      await expect(guard.canActivate(makeContext('staff-1'))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('rejects a read-only staff member attempting an export or refund', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['orders:manage']);
      getMyPermissions.execute.mockResolvedValue({
        permissions: ['orders:read'],
        isOwner: false,
      });

      await expect(guard.canActivate(makeContext('staff-1'))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows a staff member holding the required permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['orders:read']);
      getMyPermissions.execute.mockResolvedValue({
        permissions: ['orders:read'],
        isOwner: false,
      });

      await expect(guard.canActivate(makeContext('staff-1'))).resolves.toBe(true);
    });

    it('allows the store owner, who implicitly holds every permission', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['orders:manage']);
      getMyPermissions.execute.mockResolvedValue({ permissions: [], isOwner: true });

      await expect(guard.canActivate(makeContext('owner-1'))).resolves.toBe(true);
    });
  });
});
