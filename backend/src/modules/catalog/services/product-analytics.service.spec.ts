import { GetProductAnalyticsService, DateRangePreset } from './product-analytics.service';
import { OrderStatusEnum } from '../../order/entities/order.entity';

describe('GetProductAnalyticsService (Chunk 13)', () => {
  it('should calculate revenue, units sold, orders count and AOV from qualifying order items', async () => {
    const productRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'p-1', name: 'Polo Shirt', tenantId: 'tenant-1' }),
    };

    const variantRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    const currentItemsQuery = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        total_revenue: '5000.00',
        total_units: '10',
        total_orders: '4',
      }),
    };

    const prevItemsQuery = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        total_revenue: '4000.00',
        total_units: '8',
        total_orders: '3',
      }),
    };

    let queryCallCount = 0;
    const orderItemRepo = {
      createQueryBuilder: jest.fn().mockImplementation(() => {
        queryCallCount++;
        return queryCallCount === 1 ? currentItemsQuery : prevItemsQuery;
      }),
    };

    const orderRepo = {} as any;

    const service = new GetProductAnalyticsService(
      productRepo as any,
      variantRepo as any,
      orderItemRepo as any,
      orderRepo,
    );

    const summary = await service.getSummary('p-1', 'tenant-1', { preset: DateRangePreset.LAST_30_DAYS });

    expect(summary.revenue.value).toBe(5000);
    expect(summary.revenue.previousValue).toBe(4000);
    expect(summary.revenue.changePercentage).toBe(25); // +25% growth

    expect(summary.unitsSold.value).toBe(10);
    expect(summary.ordersCount.value).toBe(4);
    expect(summary.averageOrderValue.value).toBe(1250); // 5000 / 4

    expect(summary.hasViewTracking).toBe(false);
    expect(summary.viewTrackingNotice).toContain('view tracking is not active yet');
  });

  it('should return zero metrics when product has no sales in selected range', async () => {
    const productRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'p-2', name: 'New Dress', tenantId: 'tenant-1' }),
    };

    const emptyQuery = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        total_revenue: null,
        total_units: null,
        total_orders: null,
      }),
    };

    const orderItemRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(emptyQuery),
    };

    const service = new GetProductAnalyticsService(
      productRepo as any,
      {} as any,
      orderItemRepo as any,
      {} as any,
    );

    const summary = await service.getSummary('p-2', 'tenant-1', { preset: DateRangePreset.LAST_7_DAYS });

    expect(summary.revenue.value).toBe(0);
    expect(summary.unitsSold.value).toBe(0);
    expect(summary.ordersCount.value).toBe(0);
    expect(summary.averageOrderValue.value).toBe(0);
  });
});
