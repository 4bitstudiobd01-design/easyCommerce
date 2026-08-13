import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ImportCustomersService } from './import-customers.service';
import { RecordCustomerActivityService } from './record-customer-activity.service';
import { CustomerEntity, CustomerStatusEnum, CustomerSourceEnum } from '../entities/customer.entity';

describe('ImportCustomersService', () => {
  let service: ImportCustomersService;
  let customerRepository: any;
  let recordActivityService: any;

  const mockTenantId = 'tenant-1';

  beforeEach(async () => {
    customerRepository = {
      find: jest.fn().mockResolvedValue([
        { id: 'existing-1', phone: '01700000000', email: 'existing@example.com', tenantId: mockTenantId },
      ]),
      create: jest.fn((dto) => ({ id: 'new-cust', ...dto })),
      save: jest.fn((entities) => Promise.resolve(entities)),
    };

    recordActivityService = {
      execute: jest.fn().mockResolvedValue({ id: 'act-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportCustomersService,
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customerRepository,
        },
        {
          provide: RecordCustomerActivityService,
          useValue: recordActivityService,
        },
      ],
    }).compile();

    service = module.get<ImportCustomersService>(ImportCustomersService);
  });

  it('should process import rows, skip duplicates, and return result summary', async () => {
    const dto = {
      customers: [
        {
          firstName: 'Kabir',
          lastName: 'Hossain',
          email: 'kabir@example.com',
          phone: '01811000222',
          source: CustomerSourceEnum.IMPORT,
          status: CustomerStatusEnum.ACTIVE,
        },
        {
          firstName: 'Duplicate',
          lastName: 'User',
          phone: '01700000000', // Existing phone
        },
      ],
    };

    const result = await service.execute(mockTenantId, dto, 'store-1', 'Merchant');

    expect(result).toBeDefined();
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);
    expect(customerRepository.save).toHaveBeenCalled();
    expect(recordActivityService.execute).toHaveBeenCalled();
  });

  it('should throw BadRequestException if customer rows array is empty', async () => {
    await expect(service.execute(mockTenantId, { customers: [] })).rejects.toThrow(BadRequestException);
  });
});
