import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerAddressEntity } from '../entities/customer-address.entity';
import { CustomerEntity } from '../entities/customer.entity';

@Injectable()
export class ListCustomerAddressesService {
  constructor(
    @InjectRepository(CustomerAddressEntity)
    private readonly addressRepository: Repository<CustomerAddressEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  async execute(customerId: string, tenantId: string): Promise<CustomerAddressEntity[]> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }

    return this.addressRepository.find({
      where: { customerId, tenantId },
      order: {
        isDefault: 'DESC',
        createdAt: 'DESC',
      },
    });
  }
}
