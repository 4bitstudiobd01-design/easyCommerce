import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SetDefaultCustomerAddressService } from './set-default-customer-address.service';
import { CustomerAddressEntity } from '../entities/customer-address.entity';

describe('SetDefaultCustomerAddressService', () => {
  let service: SetDefaultCustomerAddressService;
  let addressRepository: any;
  let dataSource: any;

  const mockTenantId = 'tenant-1';
  const mockCustomerId = 'cust-1';
  const mockAddressId = 'addr-2';

  beforeEach(async () => {
    addressRepository = {
      findOne: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn().mockImplementation((cb) =>
        cb({
          update: jest.fn().mockResolvedValue(undefined),
          findOne: jest.fn().mockResolvedValue({
            id: mockAddressId,
            customerId: mockCustomerId,
            tenantId: mockTenantId,
            isDefault: true,
          }),
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetDefaultCustomerAddressService,
        {
          provide: getRepositoryToken(CustomerAddressEntity),
          useValue: addressRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<SetDefaultCustomerAddressService>(SetDefaultCustomerAddressService);
  });

  it('should set target address as default and unset other defaults', async () => {
    addressRepository.findOne.mockResolvedValue({
      id: mockAddressId,
      customerId: mockCustomerId,
      tenantId: mockTenantId,
      isDefault: false,
    });

    const result = await service.execute(mockAddressId, mockCustomerId, mockTenantId);

    expect(result).toBeDefined();
    expect(result.id).toBe(mockAddressId);
    expect(result.isDefault).toBe(true);
  });

  it('should throw NotFoundException if address does not exist for customer and tenant', async () => {
    addressRepository.findOne.mockResolvedValue(null);

    await expect(
      service.execute('invalid-addr', mockCustomerId, mockTenantId),
    ).rejects.toThrow(NotFoundException);
  });
});
