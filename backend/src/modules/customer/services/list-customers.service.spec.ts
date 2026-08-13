import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ListCustomersService } from './list-customers.service';
import { CustomerEntity } from '../entities/customer.entity';
import { CustomerSegmentEntity } from '../entities/customer-segment.entity';

describe('ListCustomersService', () => {
  let service: ListCustomersService;
  let repository: any;
  let segmentRepository: any;
  let dataSource: any;
  let queryBuilder: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'cust-1',
            tenantId: mockTenantId,
            firstName: 'Rahim',
            lastName: 'Hossain',
            phone: '01711000111',
            email: 'rahim@example.com',
            status: 'ACTIVE',
            source: 'ONLINE_STORE',
            createdAt: new Date(),
          },
        ],
        1,
      ]),
    };

    repository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };

    segmentRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'seg-1',
        rules: { matchType: 'ALL', conditions: [{ field: 'ordersCount', operator: 'gte', value: 2 }] },
      }),
    };

    dataSource = {
      query: jest.fn().mockImplementation((queryStr: string) => {
        if (queryStr.includes('GROUP BY status')) {
          return Promise.resolve([
            { status: 'ACTIVE', count: 10 },
            { status: 'INACTIVE', count: 2 },
          ]);
        }
        return Promise.resolve([
          {
            customerId: 'cust-1',
            customerPhone: '01711000111',
            ordersCount: 3,
            totalSpent: 4500,
            lastOrderAt: new Date().toISOString(),
          },
        ]);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListCustomersService,
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: repository,
        },
        {
          provide: getRepositoryToken(CustomerSegmentEntity),
          useValue: segmentRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<ListCustomersService>(ListCustomersService);
  });

  it('should return paginated list with aggregated order stats & statusCounts meta', async () => {
    const result = await service.execute(mockTenantId, { page: 1, limit: 20 });

    expect(result).toBeDefined();
    expect(result.data.length).toBe(1);
    expect(result.data[0].id).toBe('cust-1');
    expect(result.data[0].ordersCount).toBe(3);
    expect(result.data[0].totalSpent).toBe(4500);
    expect(result.meta.statusCounts).toEqual({ ALL: 12, ACTIVE: 10, INACTIVE: 2, BLOCKED: 0 });
  });

  it('should filter by search term across name, email, and phone', async () => {
    await service.execute(mockTenantId, { page: 1, limit: 20, search: '01711' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('c.firstName ILIKE'),
      expect.objectContaining({ s: '%01711%' }),
    );
  });

  it('should filter by status and source', async () => {
    await service.execute(mockTenantId, { page: 1, limit: 20, status: 'ACTIVE' as any, source: 'ONLINE_STORE' as any });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith('c.status = :status', { status: 'ACTIVE' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('c.source = :source', { source: 'ONLINE_STORE' });
  });

  it('should handle date range preset parameters', async () => {
    await service.execute(mockTenantId, { page: 1, limit: 20, dateRange: '30' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'c.createdAt >= :dateFromStr',
      expect.objectContaining({ dateFromStr: expect.any(String) }),
    );
  });

  it('should support sorting by derived fields like ordersCount', async () => {
    await service.execute(mockTenantId, { page: 1, limit: 20, sortBy: 'ordersCount', sortOrder: 'DESC' });

    expect(queryBuilder.leftJoin).toHaveBeenCalled();
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('COALESCE(ostats.orders_count, 0)', 'DESC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('c.id', 'ASC');
  });

  it('should fallback to createdAt if an invalid sort field is requested', async () => {
    await service.execute(mockTenantId, { page: 1, limit: 20, sortBy: 'invalidColumn' as any, sortOrder: 'ASC' });

    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('c.createdAt', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('c.id', 'ASC');
  });

  it('should handle empty result sets gracefully', async () => {
    queryBuilder.getManyAndCount.mockResolvedValueOnce([[], 0]);

    const result = await service.execute(mockTenantId, { page: 5, limit: 20 });

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });
});
