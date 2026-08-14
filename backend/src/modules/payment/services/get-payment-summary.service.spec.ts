import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetPaymentSummaryService } from './get-payment-summary.service';
import { PaymentDomainService } from './payment-domain.service';
import { PaymentEntity } from '../entities/payment.entity';
import {
  PaymentGatewayEntity,
  PaymentGatewayStatusEnum,
} from '../entities/payment-gateway.entity';
import { PaymentGatewayEnum } from '../enums/payment-gateway.enum';
import { PaymentMethodTypeEnum } from '../enums/payment-method.enum';
import { PaymentDateRangePreset } from '../dto/list-payment-transactions-query.dto';

describe('GetPaymentSummaryService', () => {
  let service: GetPaymentSummaryService;
  let paymentRepo: any;
  let gatewayRepo: any;
  let queryBuilders: any[];

  /**
   * Each call to createQueryBuilder returns a fresh recording stub. The service
   * issues, in order: current aggregate, previous aggregate, top methods,
   * currency probe (gateways come from the gateway repo).
   */
  const makeQueryBuilder = () => {
    const qb: any = {
      calls: { where: [], andWhere: [] },
      where: jest.fn(function (...args: any[]) {
        qb.calls.where.push(args);
        return qb;
      }),
      andWhere: jest.fn(function (...args: any[]) {
        qb.calls.andWhere.push(args);
        return qb;
      }),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    queryBuilders.push(qb);
    return qb;
  };

  beforeEach(async () => {
    queryBuilders = [];

    paymentRepo = {
      createQueryBuilder: jest.fn(() => makeQueryBuilder()),
    };
    gatewayRepo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPaymentSummaryService,
        PaymentDomainService,
        { provide: getRepositoryToken(PaymentEntity), useValue: paymentRepo },
        { provide: getRepositoryToken(PaymentGatewayEntity), useValue: gatewayRepo },
      ],
    }).compile();

    service = module.get<GetPaymentSummaryService>(GetPaymentSummaryService);
  });

  const primeAggregates = (current: any, previous: any, methods: any[] = []) => {
    // Query order: [0] current, [1] previous, [2] top methods, [3] currency,
    // [4] observed gateways fallback.
    queryBuilders[0]?.getRawOne.mockResolvedValue(current);
    queryBuilders[1]?.getRawOne.mockResolvedValue(previous);
    queryBuilders[2]?.getRawMany.mockResolvedValue(methods);
    queryBuilders[3]?.getRawOne.mockResolvedValue({ currency: 'BDT' });
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('scopes every aggregate query to the requesting tenant', async () => {
    paymentRepo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      qb.getRawOne.mockResolvedValue({});
      return qb;
    });

    await service.execute('tenant-a', { dateRange: PaymentDateRangePreset.LAST_30_DAYS });

    expect(queryBuilders.length).toBeGreaterThan(0);
    queryBuilders.forEach((qb) => {
      expect(qb.calls.where).toContainEqual([
        'payment.tenantId = :tenantId',
        { tenantId: 'tenant-a' },
      ]);
    });
  });

  it('computes KPI amounts, counts and period-over-period change from database aggregates', async () => {
    let call = 0;
    paymentRepo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      const index = call++;
      if (index === 0) {
        qb.getRawOne.mockResolvedValue({
          settledAmount: '845000',
          settledCount: '245',
          pendingAmount: '65000',
          pendingCount: '15',
          refundedAmount: '60000',
          refundedCount: '12',
        });
      } else if (index === 1) {
        qb.getRawOne.mockResolvedValue({
          settledAmount: '751111.11',
          settledCount: '210',
          pendingAmount: '68710',
          pendingCount: '18',
          refundedAmount: '55504.16',
          refundedCount: '10',
        });
      } else {
        qb.getRawOne.mockResolvedValue({ currency: 'BDT' });
      }
      return qb;
    });

    const summary = await service.execute('tenant-a', {
      dateRange: PaymentDateRangePreset.LAST_30_DAYS,
    });

    expect(summary.totalReceived.amount).toBe(845000);
    expect(summary.totalReceived.count).toBe(245);
    expect(summary.totalReceived.changePercent).toBe(12.5);

    // Paid is captured volume net of refunds.
    expect(summary.paid.amount).toBe(785000);

    expect(summary.pending.amount).toBe(65000);
    expect(summary.pending.count).toBe(15);
    expect(summary.pending.changePercent).toBe(-5.4);

    expect(summary.refunded.amount).toBe(60000);
    expect(summary.refunded.count).toBe(12);
    expect(summary.refunded.changePercent).toBe(8.1);
  });

  it('never emits Infinity or NaN when the previous period had no payments', async () => {
    let call = 0;
    paymentRepo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      const index = call++;
      if (index === 0) {
        qb.getRawOne.mockResolvedValue({
          settledAmount: '5000',
          settledCount: '2',
          pendingAmount: '0',
          pendingCount: '0',
          refundedAmount: '0',
          refundedCount: '0',
        });
      } else {
        qb.getRawOne.mockResolvedValue({
          settledAmount: '0',
          settledCount: '0',
          pendingAmount: '0',
          pendingCount: '0',
          refundedAmount: '0',
          refundedCount: '0',
        });
      }
      return qb;
    });

    const summary = await service.execute('tenant-a', {});

    expect(summary.totalReceived.changePercent).toBeNull();
    expect(summary.pending.changePercent).toBeNull();
    [summary.totalReceived, summary.paid, summary.pending, summary.refunded].forEach((m) => {
      expect(Number.isFinite(m.amount)).toBe(true);
      expect(Number.isNaN(m.amount)).toBe(false);
    });
  });

  it('returns zeroed KPIs for a tenant with no payments at all', async () => {
    paymentRepo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      qb.getRawOne.mockResolvedValue(undefined);
      return qb;
    });

    const summary = await service.execute('empty-tenant', {});

    expect(summary.totalReceived.amount).toBe(0);
    expect(summary.totalReceived.count).toBe(0);
    expect(summary.totalReceived.changePercent).toBeNull();
    expect(summary.overview.every((slice) => slice.percentage === 0)).toBe(true);
    expect(summary.topPaymentMethods).toEqual([]);
  });

  it('derives donut percentages dynamically rather than hardcoding them', async () => {
    let call = 0;
    paymentRepo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      const index = call++;
      if (index === 0) {
        qb.getRawOne.mockResolvedValue({
          settledAmount: '800000',
          settledCount: '230',
          pendingAmount: '65000',
          pendingCount: '15',
          refundedAmount: '60000',
          refundedCount: '12',
        });
      } else {
        qb.getRawOne.mockResolvedValue({ currency: 'BDT' });
      }
      return qb;
    });

    const summary = await service.execute('tenant-a', {});
    const total = summary.overview.reduce((sum, slice) => sum + slice.percentage, 0);

    expect(summary.overview.map((s) => s.label)).toEqual(['Paid', 'Pending', 'Refunded']);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });

  it('ranks top payment methods by amount with dynamic percentages', async () => {
    let call = 0;
    paymentRepo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      const index = call++;
      if (index === 2) {
        qb.getRawMany.mockResolvedValue([
          { method: PaymentMethodTypeEnum.BKASH, amount: '420000', count: '120' },
          { method: PaymentMethodTypeEnum.COD, amount: '285000', count: '85' },
          { method: PaymentMethodTypeEnum.NAGAD, amount: '95000', count: '22' },
          { method: PaymentMethodTypeEnum.CARD, amount: '45000', count: '10' },
        ]);
      }
      qb.getRawOne.mockResolvedValue({ currency: 'BDT' });
      return qb;
    });

    const summary = await service.execute('tenant-a', {});

    expect(summary.topPaymentMethods[0]).toMatchObject({
      method: PaymentMethodTypeEnum.BKASH,
      label: 'bKash',
      amount: 420000,
      count: 120,
      percentage: 49.7,
    });
    expect(summary.topPaymentMethods[1].label).toBe('Cash on Delivery');
    expect(summary.topPaymentMethods[3].percentage).toBe(5.3);
  });

  it('returns the merchant’s configured gateways without exposing credentials', async () => {
    gatewayRepo.find.mockResolvedValue([
      {
        id: 'gw-1',
        code: PaymentGatewayEnum.BKASH,
        name: 'bKash',
        kind: 'Mobile Payment',
        status: PaymentGatewayStatusEnum.CONNECTED,
        isEnabled: true,
      },
    ]);
    paymentRepo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      qb.getRawOne.mockResolvedValue({ currency: 'BDT' });
      return qb;
    });

    const summary = await service.execute('tenant-a', {});

    expect(gatewayRepo.find).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a' },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    expect(summary.gateways[0]).toEqual({
      id: 'gw-1',
      code: PaymentGatewayEnum.BKASH,
      name: 'bKash',
      kind: 'Mobile Payment',
      status: PaymentGatewayStatusEnum.CONNECTED,
      isEnabled: true,
    });
    expect(JSON.stringify(summary.gateways)).not.toMatch(/secret|password|apiKey|storePass/i);
  });

  it('keeps the KPI split visible when the table is filtered to one status', async () => {
    paymentRepo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      qb.getRawOne.mockResolvedValue({ currency: 'BDT' });
      return qb;
    });

    await service.execute('tenant-a', { status: 'PAID' as any });

    // The status filter must never reach the aggregate queries, otherwise the
    // Pending and Refunded cards would collapse to zero.
    queryBuilders.forEach((qb) => {
      const conditions = JSON.stringify(qb.calls.andWhere);
      expect(conditions).not.toContain('payment.status = :status');
    });
  });

  it('applies the same gateway and search filters to KPIs as to the table', async () => {
    paymentRepo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      qb.getRawOne.mockResolvedValue({ currency: 'BDT' });
      return qb;
    });

    await service.execute('tenant-a', {
      gateway: PaymentGatewayEnum.STRIPE,
      minAmount: 100,
    });

    const conditions = JSON.stringify(queryBuilders[0].calls.andWhere);
    expect(conditions).toContain('payment.gateway = :gateway');
    expect(conditions).toContain('payment.amount >= :minAmount');
  });
});
