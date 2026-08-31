import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ManageCustomerSegmentService } from './manage-customer-segment.service';
import { CustomerSegmentEntity } from '../entities/customer-segment.entity';
import { CustomerEntity } from '../entities/customer.entity';

describe('ManageCustomerSegmentService', () => {
  let service: ManageCustomerSegmentService;
  let segmentRepository: any;
  let customerRepository: any;

  const mockTenantId = 'tenant-1';

  beforeEach(async () => {
    segmentRepository = {
      create: jest.fn((dto) => ({ id: 'seg-1', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'seg-1', ...entity })),
      find: jest.fn().mockResolvedValue([
        {
          id: 'seg-1',
          name: 'VIP Buyers',
          rules: { matchType: 'ALL', conditions: [{ field: 'ordersCount', operator: 'gte', value: 2 }] },
        },
      ]),
      findOne: jest.fn().mockResolvedValue({
        id: 'seg-1',
        name: 'VIP Buyers',
        rules: { matchType: 'ALL', conditions: [{ field: 'ordersCount', operator: 'gte', value: 2 }] },
      }),
      remove: jest.fn().mockResolvedValue({}),
    };

    customerRepository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
        getRawOne: jest.fn().mockResolvedValue({ count: 5, avg_spend: 12000 }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManageCustomerSegmentService,
        {
          provide: getRepositoryToken(CustomerSegmentEntity),
          useValue: segmentRepository,
        },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customerRepository,
        },
      ],
    }).compile();

    service = module.get<ManageCustomerSegmentService>(ManageCustomerSegmentService);
  });

  it('should create and save a new customer segment', async () => {
    const dto = {
      name: 'High Value Customers',
      rules: { matchType: 'ALL' as const, conditions: [{ field: 'totalSpent' as const, operator: 'gte' as const, value: 50000 }] },
    };

    const res = await service.create(mockTenantId, dto, 'store-1');

    expect(res).toBeDefined();
    expect(res.name).toBe('High Value Customers');
    expect(segmentRepository.save).toHaveBeenCalled();
  });

  it('should list segments with dynamic customer match counts', async () => {
    const res = await service.findAll(mockTenantId);

    expect(res).toBeDefined();
    expect(res.length).toBe(1);
    expect(res[0].customerCount).toBe(5);
  });
});
