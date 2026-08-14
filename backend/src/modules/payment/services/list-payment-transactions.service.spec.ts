import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListPaymentTransactionsService } from './list-payment-transactions.service';
import { PaymentDomainService } from './payment-domain.service';
import {
  PaymentEntity,
  PaymentTransactionStatusEnum,
} from '../entities/payment.entity';
import { PaymentGatewayEnum } from '../enums/payment-gateway.enum';
import { PaymentMethodTypeEnum } from '../enums/payment-method.enum';
import { PaymentDateRangePreset } from '../dto/list-payment-transactions-query.dto';

describe('ListPaymentTransactionsService', () => {
  let service: ListPaymentTransactionsService;
  let paymentRepo: any;
  let qb: any;

  const buildPayment = (overrides: Partial<PaymentEntity> = {}): PaymentEntity =>
    ({
      id: 'pay-1',
      orderId: 'order-1',
      orderNumber: 'EC-1024',
      customerId: 'cus-1',
      transactionNumber: 'TXN-10245',
      tranId: 'SSLCZ-8F92A1B3C4',
      amount: 4500,
      refundedAmount: 0,
      currency: 'BDT',
      gateway: PaymentGatewayEnum.SSLCOMMERZ,
      paymentMethod: PaymentMethodTypeEnum.BKASH,
      status: PaymentTransactionStatusEnum.COMPLETED,
      tenantId: 'tenant-a',
      createdAt: new Date('2025-08-14T04:46:00.000Z'),
      updatedAt: new Date('2025-08-14T04:46:00.000Z'),
      ...overrides,
    }) as PaymentEntity;

  beforeEach(async () => {
    qb = {
      recorded: { where: [], andWhere: [] },
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn(function (...args: any[]) {
        qb.recorded.where.push(args);
        return qb;
      }),
      andWhere: jest.fn(function (...args: any[]) {
        qb.recorded.andWhere.push(args);
        return qb;
      }),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(245),
      getRawAndEntities: jest.fn().mockResolvedValue({
        entities: [buildPayment()],
        raw: [{ customerName: 'Rahim Hossain', customerPhone: '+8801712345678' }],
      }),
    };

    paymentRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListPaymentTransactionsService,
        PaymentDomainService,
        { provide: getRepositoryToken(PaymentEntity), useValue: paymentRepo },
      ],
    }).compile();

    service = module.get<ListPaymentTransactionsService>(ListPaymentTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('always scopes the query to the requesting tenant', async () => {
    await service.execute('tenant-a', {});

    expect(qb.recorded.where).toContainEqual([
      'payment.tenantId = :tenantId',
      { tenantId: 'tenant-a' },
    ]);
  });

  it('paginates on the server and reports accurate pagination meta', async () => {
    const result = await service.execute('tenant-a', { page: 2, limit: 10 });

    expect(qb.offset).toHaveBeenCalledWith(10);
    expect(qb.limit).toHaveBeenCalledWith(10);
    expect(result.meta).toEqual({ page: 2, limit: 10, total: 245, totalPages: 25 });
  });

  it('caps the page size so a client cannot request unbounded rows', async () => {
    await service.execute('tenant-a', { limit: 100000 });
    expect(qb.limit).toHaveBeenCalledWith(100);
  });

  it('searches transaction, gateway reference, order and customer fields via parameters', async () => {
    // The search predicate is built inside a Brackets callback, so run that
    // callback against a recorder to inspect the OR-group it produces.
    await service.execute('tenant-a', { search: 'Rahim' });

    const bracket = qb.recorded.andWhere.find(
      (call: any[]) => call[0] && typeof call[0].whereFactory === 'function',
    );
    expect(bracket).toBeDefined();

    const fragments: string[] = [];
    const params: any[] = [];
    const recorder: any = {
      where: (sql: string, p: any) => {
        fragments.push(sql);
        params.push(p);
        return recorder;
      },
      orWhere: (sql: string, p: any) => {
        fragments.push(sql);
        params.push(p);
        return recorder;
      },
    };
    bracket[0].whereFactory(recorder);

    expect(fragments).toEqual(
      expect.arrayContaining([
        'payment."transactionNumber" ILIKE :term',
        'payment."tranId" ILIKE :term',
        'payment."orderNumber" ILIKE :term',
        'ord."customerName" ILIKE :term',
        'ord."customerPhone" ILIKE :term',
      ]),
    );
    // Parameterised, never interpolated — no SQL injection surface.
    expect(params[0]).toEqual({ term: '%Rahim%' });
  });

  it('does not leak a search term into raw SQL text', async () => {
    await service.execute('tenant-a', { search: "'; DROP TABLE payments; --" });

    // The hostile string may only ever appear as a bound parameter value.
    qb.recorded.andWhere.forEach((call: any[]) => {
      if (typeof call[0] === 'string') {
        expect(call[0]).not.toContain('DROP TABLE');
      }
    });

    const bracket = qb.recorded.andWhere.find(
      (call: any[]) => call[0] && typeof call[0].whereFactory === 'function',
    );
    const recorder: any = {
      where: (sql: string) => {
        expect(sql).not.toContain('DROP TABLE');
        return recorder;
      },
      orWhere: (sql: string) => {
        expect(sql).not.toContain('DROP TABLE');
        return recorder;
      },
    };
    bracket[0].whereFactory(recorder);
  });

  /** The SQL fragment of each recorded andWhere call, unescaped. */
  const sqlFragments = () =>
    qb.recorded.andWhere
      .map((call: any[]) => call[0])
      .filter((sql: unknown): sql is string => typeof sql === 'string');

  it('applies status, gateway and method filters', async () => {
    await service.execute('tenant-a', {
      status: PaymentTransactionStatusEnum.COMPLETED,
      gateway: PaymentGatewayEnum.BKASH,
      paymentMethod: PaymentMethodTypeEnum.BKASH,
    });

    expect(sqlFragments()).toEqual(
      expect.arrayContaining([
        'payment.status = :status',
        'payment.gateway = :gateway',
        'payment."paymentMethod" = :paymentMethod',
      ]),
    );
  });

  it('constrains results to a half-open date window so boundaries never double count', async () => {
    await service.execute('tenant-a', { dateRange: PaymentDateRangePreset.LAST_7_DAYS });

    expect(sqlFragments()).toEqual(
      expect.arrayContaining([
        'payment."createdAt" >= :periodStart',
        'payment."createdAt" < :periodEnd',
      ]),
    );
  });

  it('sorts by a stable key so pagination cannot repeat or skip rows', async () => {
    await service.execute('tenant-a', {});

    expect(qb.orderBy).toHaveBeenCalledWith('payment."createdAt"', 'DESC');
    expect(qb.addOrderBy).toHaveBeenCalledWith('payment.id', 'ASC');
  });

  it('maps a payment onto the dashboard row shape with labels and masked reference', async () => {
    const result = await service.execute('tenant-a', {});
    const row = result.data[0];

    expect(row.transactionNumber).toBe('TXN-10245');
    expect(row.gatewayTransactionId).toBe('SSLCZ-8F92...');
    expect(row.orderNumber).toBe('EC-1024');
    expect(row.customer).toEqual({
      id: 'cus-1',
      name: 'Rahim Hossain',
      phone: '+8801712345678',
    });
    expect(row.gatewayLabel).toBe('SSLCommerz');
    expect(row.paymentMethodLabel).toBe('bKash');
    expect(row.amount).toBe(4500);
    expect(row.isRefundable).toBe(true);
  });

  it('never exposes the full gateway reference in a list row', async () => {
    const result = await service.execute('tenant-a', {});
    expect(result.data[0].gatewayTransactionId).not.toBe('SSLCZ-8F92A1B3C4');
  });

  it('falls back safely when the order or customer is missing', async () => {
    qb.getRawAndEntities.mockResolvedValue({
      entities: [buildPayment({ customerId: undefined })],
      raw: [{ customerName: undefined, customerPhone: undefined }],
    });

    const result = await service.execute('tenant-a', {});

    expect(result.data[0].customer.name).toBe('Guest Customer');
    expect(result.data[0].customer.phone).toBeUndefined();
  });

  it('marks failed and fully refunded payments as non-refundable', async () => {
    qb.getRawAndEntities.mockResolvedValue({
      entities: [
        buildPayment({ id: 'p-failed', status: PaymentTransactionStatusEnum.FAILED }),
        buildPayment({
          id: 'p-refunded',
          status: PaymentTransactionStatusEnum.REFUNDED,
          refundedAmount: 4500,
        }),
        buildPayment({
          id: 'p-partial',
          status: PaymentTransactionStatusEnum.PARTIALLY_REFUNDED,
          refundedAmount: 1800,
        }),
      ],
      raw: [{}, {}, {}],
    });

    const result = await service.execute('tenant-a', {});

    expect(result.data[0].isRefundable).toBe(false);
    expect(result.data[1].isRefundable).toBe(false);
    expect(result.data[2].isRefundable).toBe(true);
  });

  it('returns an empty page rather than failing when the tenant has no payments', async () => {
    qb.getCount.mockResolvedValue(0);
    qb.getRawAndEntities.mockResolvedValue({ entities: [], raw: [] });

    const result = await service.execute('tenant-a', {});

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });
});
