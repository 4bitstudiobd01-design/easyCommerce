import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateCustomerAddressService } from './create-customer-address.service';
import { CustomerAddressEntity } from '../entities/customer-address.entity';
import { CustomerEntity } from '../entities/customer.entity';

describe('CreateCustomerAddressService', () => {
  let service: CreateCustomerAddressService;
  let addressRepository: any;
  let customerRepository: any;
  let dataSource: any;

  const mockTenantId = 'tenant-1';
  const mockCustomerId = 'cust-1';

  beforeEach(async () => {
    addressRepository = {
      count: jest.fn(),
    };
    customerRepository = {
      findOne: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn().mockImplementation((cb) =>
        cb({
          update: jest.fn().mockResolvedValue(undefined),
          create: jest.fn((_, dto) => ({ id: 'addr-1', ...dto })),
          save: jest.fn((entity) => Promise.resolve(entity)),
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCustomerAddressService,
        {
          provide: getRepositoryToken(CustomerAddressEntity),
          useValue: addressRepository,
        },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customerRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<CreateCustomerAddressService>(CreateCustomerAddressService);
  });

  it('should create address and automatically set as default if first address', async () => {
    customerRepository.findOne.mockResolvedValue({ id: mockCustomerId, tenantId: mockTenantId });
    addressRepository.count.mockResolvedValue(0);

    const dto = {
      recipientName: 'Rahim Hossain',
      phone: '01711000111',
      addressLine1: 'House 12, Road 5',
      city: 'Dhaka',
    };

    const result = await service.execute(mockCustomerId, mockTenantId, dto);

    expect(result).toBeDefined();
    expect(result.recipientName).toBe('Rahim Hossain');
    expect(result.isDefault).toBe(true);
  });

  it('should throw NotFoundException if customer does not exist for tenant', async () => {
    customerRepository.findOne.mockResolvedValue(null);

    await expect(
      service.execute('invalid-cust', mockTenantId, {
        recipientName: 'Rahim',
        phone: '01711000111',
        addressLine1: 'Line 1',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
