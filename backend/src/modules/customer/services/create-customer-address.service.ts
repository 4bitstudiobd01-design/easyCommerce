import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerAddressEntity } from '../entities/customer-address.entity';
import { CustomerEntity } from '../entities/customer.entity';
import { CreateCustomerAddressDto } from '../dto/create-customer-address.dto';

@Injectable()
export class CreateCustomerAddressService {
  constructor(
    @InjectRepository(CustomerAddressEntity)
    private readonly addressRepository: Repository<CustomerAddressEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    customerId: string,
    tenantId: string,
    dto: CreateCustomerAddressDto,
    storeId?: string,
  ): Promise<CustomerAddressEntity> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }

    const existingCount = await this.addressRepository.count({
      where: { customerId, tenantId },
    });

    const isFirstAddress = existingCount === 0;
    const shouldBeDefault = dto.isDefault || isFirstAddress;

    return this.dataSource.transaction(async (manager) => {
      if (shouldBeDefault) {
        await manager.update(
          CustomerAddressEntity,
          { customerId, tenantId },
          { isDefault: false },
        );
      }

      const newAddress = manager.create(CustomerAddressEntity, {
        ...dto,
        customerId,
        tenantId,
        storeId: storeId || customer.storeId,
        isDefault: shouldBeDefault,
      });

      return manager.save(newAddress);
    });
  }
}
