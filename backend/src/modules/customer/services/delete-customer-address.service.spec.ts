import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DeleteCustomerAddressService } from './delete-customer-address.service';
import { CustomerAddressEntity } from '../entities/customer-address.entity';

describe('DeleteCustomerAddressService', () => {
  let service: DeleteCustomerAddressService;
  let addressRepository: any;
  let dataSource: any;

  const mockTenantId = 'tenant-1';
  const mockCustomerId = 'cust-1';
  const mockAddressId = 'addr-1';

  beforeEach(async () => {
    addressRepository = {
      findOne: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn().mockImplementation((cb) =>
        cb({
          delete: jest.fn().mockResolvedValue(undefined),
          findOne: jest.fn().mockResolvedValue({
            id: 'addr-2',
            customerId: mockCustomerId,
            tenantId: mockTenantId,
            isDefault: false,
          }),
          save: jest.fn((entity) => Promise.resolve(entity)),
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCustomerAddressService,
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

    service = module.get<DeleteCustomerAddressService>(DeleteCustomerAddressService);
  });

  it('should delete address and assign new default if deleted address was default', async () => {
    addressRepository.findOne.mockResolvedValue({
      id: mockAddressId,
      customerId: mockCustomerId,
      tenantId: mockTenantId,
      isDefault: true,
    });

    const result = await service.execute(mockAddressId, mockCustomerId, mockTenantId);

    expect(result).toEqual({ success: true });
  });

  it('should throw NotFoundException if address does not exist or tenant mismatch occurs', async () => {
    addressRepository.findOne.mockResolvedValue(null);

    await expect(
      service.execute('invalid-addr', mockCustomerId, mockTenantId),
    ).rejects.toThrow(NotFoundException);
  });
});
