import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { FindCustomerByIdService } from './find-customer-by-id.service';
import { CustomerEntity } from '../entities/customer.entity';

describe('FindCustomerByIdService', () => {
  let service: FindCustomerByIdService;
  let repository: any;
  let dataSource: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
    };

    dataSource = {
      query: jest.fn().mockImplementation((queryStr: string) => {
        if (queryStr.includes('city, district, division')) {
          return Promise.resolve([{ city: 'Dhaka', district: 'Dhaka', division: 'Dhaka' }]);
        }
        return Promise.resolve([
          {
            totalOrders: 12,
            completedOrders: 8,
            cancelledOrders: 1,
            validOrders: 11,
            totalSpent: 24500,
            lastOrderAt: new Date().toISOString(),
          },
        ]);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindCustomerByIdService,
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: repository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<FindCustomerByIdService>(FindCustomerByIdService);
  });

  it('should return customer details with complete statistics and derived location', async () => {
    repository.findOne.mockResolvedValue({
      id: 'cust-1',
      tenantId: mockTenantId,
      firstName: 'Rahim',
      lastName: 'Hossain',
      phone: '01711000111',
      email: 'rahim@example.com',
      status: 'ACTIVE',
      source: 'ONLINE_STORE',
      createdAt: new Date(),
    });

    const result = await service.execute('cust-1', mockTenantId);

    expect(result).toBeDefined();
    expect(result.id).toBe('cust-1');
    expect(result.location).toBe('Dhaka, Bangladesh');
    expect(result.stats.totalOrders).toBe(12);
    expect(result.stats.completedOrders).toBe(8);
    expect(result.stats.cancelledOrders).toBe(1);
    expect(result.stats.totalSpent).toBe(24500);
    // 24500 / 11 = 2227.2727…; kept to 2dp rather than truncated to whole taka, so
    // customer averages reconcile against the underlying order totals.
    expect(result.stats.avgOrderValue).toBe(2227.27);
  });

  it('should throw NotFoundException if customer does not exist or tenantId mismatch occurs', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.execute('invalid-id', mockTenantId)).rejects.toThrow(NotFoundException);
  });

  it('should handle customers with 0 orders safely', async () => {
    repository.findOne.mockResolvedValue({
      id: 'cust-2',
      tenantId: mockTenantId,
      firstName: 'New',
      lastName: 'User',
      phone: '01900000000',
    });

    dataSource.query.mockImplementation((queryStr: string) => {
      if (queryStr.includes('city, district, division')) {
        return Promise.resolve([]);
      }
      return Promise.resolve([
        {
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          validOrders: 0,
          totalSpent: 0,
          lastOrderAt: null,
        },
      ]);
    });

    const result = await service.execute('cust-2', mockTenantId);

    expect(result.location).toBeNull();
    expect(result.stats.totalOrders).toBe(0);
    expect(result.stats.completedOrders).toBe(0);
    expect(result.stats.cancelledOrders).toBe(0);
    expect(result.stats.totalSpent).toBe(0);
    expect(result.stats.avgOrderValue).toBe(0);
    expect(result.stats.lastOrderAt).toBeNull();
  });
});
