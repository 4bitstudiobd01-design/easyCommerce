import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerAddressEntity } from '../entities/customer-address.entity';

@Injectable()
export class DeleteCustomerAddressService {
  constructor(
    @InjectRepository(CustomerAddressEntity)
    private readonly addressRepository: Repository<CustomerAddressEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    addressId: string,
    customerId: string,
    tenantId: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.addressRepository.findOne({
      where: { id: addressId, customerId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Address with ID ${addressId} not found for this customer.`);
    }

    const wasDefault = existing.isDefault;

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(CustomerAddressEntity, {
        id: addressId,
        customerId,
        tenantId,
      });

      // If deleted address was default, set the latest remaining address as default
      if (wasDefault) {
        const remainingLatest = await manager.findOne(CustomerAddressEntity, {
          where: { customerId, tenantId },
          order: { createdAt: 'DESC' },
        });

        if (remainingLatest) {
          remainingLatest.isDefault = true;
          await manager.save(CustomerAddressEntity, remainingLatest);
        }
      }
    });

    return { success: true };
  }
}
