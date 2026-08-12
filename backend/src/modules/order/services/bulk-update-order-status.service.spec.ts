import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BulkUpdateOrderStatusService } from './bulk-update-order-status.service';
import { OrderStateService } from './order-state.service';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum } from '../entities/order.entity';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';
import { AdjustStockService } from '../../inventory/services/adjust-stock.service';

const TENANT_ID = 'tenant-1';
const STORE_ID = 'store-1';
const USER_ID = 'user-1';

/**
 * Guards the bulk path against regressing to a hand-rolled transition validator.
 * Bulk updates must honour exactly the same state machine as single-order updates,
 * otherwise merchants can drive orders into illegal states 50 at a time.
 */
describe('BulkUpdateOrderStatusService', () => {
  let service: BulkUpdateOrderStatusService;
  let orders: OrderEntity[];
  let updateSpy: jest.Mock;
  let insertSpy: jest.Mock;

  const buildOrder = (id: string, orderStatus: OrderStatusEnum): OrderEntity =>
    ({
      id,
      orderNumber: `ORD-${id}`,
      orderStatus,
      paymentStatus: PaymentStatusEnum.COD_PENDING,
      tenantId: TENANT_ID,
      storeSlug: STORE_ID,
      items: [],
    }) as unknown as OrderEntity;

  beforeEach(async () => {
    orders = [];
    updateSpy = jest.fn().mockResolvedValue({ affected: 0 });
    insertSpy = jest.fn().mockResolvedValue({});

    const managerStub = {
      update: updateSpy,
      insert: insertSpy,
      create: (_entity: unknown, plain: unknown) => plain,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkUpdateOrderStatusService,
        OrderStateService,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: { find: jest.fn(async () => orders), createQueryBuilder: jest.fn() },
        },
        {
          provide: getRepositoryToken(OrderStatusHistoryEntity),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(async (cb: (m: unknown) => Promise<void>) => cb(managerStub)),
          },
        },
        {
          provide: AdjustStockService,
          useValue: { execute: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(BulkUpdateOrderStatusService);
  });

  const run = (targetStatus: OrderStatusEnum) =>
    service.execute(
      TENANT_ID,
      STORE_ID,
      { orderIds: orders.map((o) => o.id), targetStatus },
      USER_ID,
    );

  it('rejects illegal transitions instead of applying them', async () => {
    orders = [buildOrder('a', OrderStatusEnum.PENDING)];

    const result = await run(OrderStatusEnum.DELIVERED);

    expect(result.successful).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].reason).toContain('Invalid order status transition');
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('rejects transitions out of terminal states', async () => {
    orders = [
      buildOrder('a', OrderStatusEnum.CANCELLED),
      buildOrder('b', OrderStatusEnum.RETURNED),
    ];

    const result = await run(OrderStatusEnum.PROCESSING);

    expect(result.successful).toBe(0);
    expect(result.failed).toBe(2);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('applies legal transitions in a single batched update', async () => {
    orders = [
      buildOrder('a', OrderStatusEnum.PENDING),
      buildOrder('b', OrderStatusEnum.PENDING),
    ];

    const result = await run(OrderStatusEnum.CONFIRMED);

    expect(result.successful).toBe(2);
    expect(result.failed).toBe(0);
    // One UPDATE for the whole batch, not one per order.
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy).toHaveBeenCalledTimes(1);
  });

  it('applies only the legal subset when a batch is mixed', async () => {
    orders = [
      buildOrder('ok', OrderStatusEnum.PENDING),
      buildOrder('bad', OrderStatusEnum.DELIVERED),
    ];

    const result = await run(OrderStatusEnum.CONFIRMED);

    expect(result.successful).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0].orderNumber).toBe('ORD-bad');
  });

  it('marks payment as PAID when bulk-transitioning to DELIVERED', async () => {
    orders = [buildOrder('a', OrderStatusEnum.SHIPPED)];

    await run(OrderStatusEnum.DELIVERED);

    expect(updateSpy).toHaveBeenCalledWith(
      OrderEntity,
      expect.anything(),
      expect.objectContaining({
        orderStatus: OrderStatusEnum.DELIVERED,
        paymentStatus: PaymentStatusEnum.PAID,
      }),
    );
  });

  it('reports ids that do not belong to the tenant/store as failures', async () => {
    orders = [];

    const result = await service.execute(
      TENANT_ID,
      STORE_ID,
      { orderIds: ['someone-elses-order'], targetStatus: OrderStatusEnum.CONFIRMED },
      USER_ID,
    );

    expect(result.successful).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].reason).toBe('Order not found for this store.');
  });
});
