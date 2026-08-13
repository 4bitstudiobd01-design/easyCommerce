import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerAddressEntity } from '../entities/customer-address.entity';
import { UpdateCustomerAddressDto } from '../dto/update-customer-address.dto';

@Injectable()
export class UpdateCustomerAddressService {
  constructor(
    @InjectRepository(CustomerAddressEntity)
    private readonly addressRepository: Repository<CustomerAddressEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    addressId: string,
    customerId: string,
    tenantId: string,
    dto: UpdateCustomerAddressDto,
  ): Promise<CustomerAddressEntity> {
    const existing = await this.addressRepository.findOne({
      where: { id: addressId, customerId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Address with ID ${addressId} not found for this customer.`);
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.isDefault) {
        await manager.update(
          CustomerAddressEntity,
          { customerId, tenantId },
          { isDefault: false },
        );
      }

      await manager.update(
        CustomerAddressEntity,
        { id: addressId, customerId, tenantId },
        { ...dto },
      );

      const updated = await manager.findOne(CustomerAddressEntity, {
        where: { id: addressId, customerId, tenantId },
      });

      if (!updated) {
        throw new NotFoundException(`Address with ID ${addressId} not found.`);
      }

      return updated;
    });
  }
}
