import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { CreateCustomerService } from './create-customer.service';
import { CustomerEntity, CustomerStatusEnum, CustomerSourceEnum } from '../entities/customer.entity';

describe('CreateCustomerService', () => {
  let service: CreateCustomerService;
  let repository: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockStoreId = 'store-uuid-1';

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn(async (entity) => ({ id: 'cust-uuid-1', ...entity, createdAt: new Date() })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCustomerService,
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CreateCustomerService>(CreateCustomerService);
  });

  it('should create a customer successfully when phone and email are unique', async () => {
    repository.findOne.mockResolvedValue(null);

    const dto = {
      firstName: 'Rahim',
      lastName: 'Hossain',
      phone: '01711000111',
      email: 'rahim@example.com',
      status: CustomerStatusEnum.ACTIVE,
      source: CustomerSourceEnum.ONLINE_STORE,
    };

    const result = await service.execute(mockTenantId, dto, mockStoreId);

    expect(result).toBeDefined();
    expect(result.id).toBe('cust-uuid-1');
    expect(result.firstName).toBe('Rahim');
    expect(result.lastName).toBe('Hossain');
    expect(result.tenantId).toBe(mockTenantId);
    expect(repository.save).toHaveBeenCalled();
  });

  it('should throw ConflictException if customer with phone already exists in tenant', async () => {
    repository.findOne.mockResolvedValue({ id: 'existing-id', phone: '01711000111' });

    const dto = {
      firstName: 'Rahim',
      lastName: 'Hossain',
      phone: '01711000111',
    };

    await expect(service.execute(mockTenantId, dto, mockStoreId)).rejects.toThrow(ConflictException);
  });

  it('should throw ConflictException if customer with email already exists in tenant', async () => {
    repository.findOne
      .mockResolvedValueOnce(null) // phone check passes
      .mockResolvedValueOnce({ id: 'existing-id', email: 'rahim@example.com' }); // email check fails

    const dto = {
      firstName: 'Rahim',
      lastName: 'Hossain',
      phone: '01711000222',
      email: 'rahim@example.com',
    };

    await expect(service.execute(mockTenantId, dto, mockStoreId)).rejects.toThrow(ConflictException);
  });
});
