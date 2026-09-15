import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetCustomerAnalyticsService } from './get-customer-analytics.service';
import { CustomerEntity } from '../entities/customer.entity';

describe('GetCustomerAnalyticsService', () => {
  let service: GetCustomerAnalyticsService;
  let customerRepository: any;

  const mockTenantId = 'tenant-1';

  beforeEach(async () => {
    customerRepository = {
      count: jest.fn().mockResolvedValue(10),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(4),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { source: 'ONLINE_STORE', count: '8' },
          { source: 'MANUAL', count: '2' },
        ]),
      }),
      manager: {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('repeatCustomers')) {
            return Promise.resolve([{ repeatCustomers: 3 }]);
          }
          if (sql.includes('growthRaw') || sql.includes('TO_CHAR')) {
            return Promise.resolve([{ dateStr: '2026-08-13', cnt: 2, rev: 5000 }]);
          }
          if (sql.includes('Top Customers') || sql.includes('ordersCount')) {
            return Promise.resolve([
              {
                id: 'cust-1',
                firstName: 'Rahim',
                lastName: 'Hossain',
                email: 'rahim@example.com',
                phone: '01700000000',
                ordersCount: 3,
                totalSpent: 12000,
                lastOrderAt: new Date(),
              },
            ]);
          }
          return Promise.resolve([{ totalRevenue: 15000, totalOrdersCount: 5 }]);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCustomerAnalyticsService,
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customerRepository,
        },
      ],
    }).compile();

    service = module.get<GetCustomerAnalyticsService>(GetCustomerAnalyticsService);
  });

  it('should compute overview analytics metrics accurately from DB', async () => {
    const res = await service.getOverview(mockTenantId, {});

    expect(res).toBeDefined();
    expect(res.totalCustomers).toBe(10);
    expect(res.totalRevenue).toBe(15000);
    expect(res.repeatCustomers).toBe(3);
  });

  it('should return source distribution breakdown', async () => {
    const res = await service.getSourceDistribution(mockTenantId);

    expect(res).toBeDefined();
    expect(res.length).toBe(2);
    expect(res[0].source).toBe('ONLINE_STORE');
  });

  it('should return top customers ranking', async () => {
    const res = await service.getTopCustomers(mockTenantId, 5);

    expect(res).toBeDefined();
    expect(res.length).toBe(1);
    expect(res[0].firstName).toBe('Rahim');
  });
});
