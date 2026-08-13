import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { BulkCustomerStatusService } from './bulk-customer-status.service';
import { RecordCustomerActivityService } from './record-customer-activity.service';
import { CustomerEntity, CustomerStatusEnum } from '../entities/customer.entity';

describe('BulkCustomerStatusService', () => {
  let service: BulkCustomerStatusService;
  let customerRepository: any;
  let recordActivityService: any;

  const mockTenantId = 'tenant-1';

  beforeEach(async () => {
    customerRepository = {
      find: jest.fn().mockResolvedValue([
        { id: 'cust-1', status: CustomerStatusEnum.ACTIVE, tenantId: mockTenantId },
        { id: 'cust-2', status: CustomerStatusEnum.ACTIVE, tenantId: mockTenantId },
      ]),
      update: jest.fn().mockResolvedValue({ affected: 2 }),
    };

    recordActivityService = {
      execute: jest.fn().mockResolvedValue({ id: 'act-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkCustomerStatusService,
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

    service = module.get<BulkCustomerStatusService>(BulkCustomerStatusService);
  });

  it('should bulk update customer statuses for tenant and record activity events', async () => {
    const dto = {
      customerIds: ['cust-1', 'cust-2'],
      status: CustomerStatusEnum.BLOCKED,
    };

    const result = await service.execute(mockTenantId, dto, 'Belal');

    expect(result).toBeDefined();
    expect(result.affected).toBe(2);
    expect(result.status).toBe(CustomerStatusEnum.BLOCKED);
    expect(customerRepository.update).toHaveBeenCalled();
    expect(recordActivityService.execute).toHaveBeenCalledTimes(2);
  });

  it('should throw BadRequestException if customerIds array is empty', async () => {
    await expect(
      service.execute(mockTenantId, { customerIds: [], status: CustomerStatusEnum.BLOCKED }),
    ).rejects.toThrow(BadRequestException);
  });
});
