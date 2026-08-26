import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity, CustomerStatusEnum, CustomerAccountTypeEnum, CustomerSourceEnum } from '../entities/customer.entity';
import { CreateCustomerDto } from '../dto/create-customer.dto';

@Injectable()
export class CreateCustomerService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  async execute(tenantId: string, dto: CreateCustomerDto, storeId?: string): Promise<CustomerEntity> {
    const phone = dto.phone.trim();
    const existingCustomer = await this.customerRepository.findOne({
      where: { tenantId, phone },
    });

    if (existingCustomer) {
      // If customer with this phone number already exists (e.g. from guest orders), update info gracefully
      existingCustomer.firstName = dto.firstName.trim() || existingCustomer.firstName;
      existingCustomer.lastName = dto.lastName.trim() || existingCustomer.lastName;
      if (dto.email && dto.email.trim()) {
        existingCustomer.email = dto.email.trim().toLowerCase();
      }
      if (dto.status) {
        existingCustomer.status = dto.status;
      } else if (existingCustomer.status === CustomerStatusEnum.GUEST) {
        existingCustomer.status = CustomerStatusEnum.ACTIVE;
      }
      if (dto.source) {
        existingCustomer.source = dto.source;
      }
      existingCustomer.accountType = CustomerAccountTypeEnum.REGISTERED;
      return this.customerRepository.save(existingCustomer);
    }

    const origin = dto.origin ? dto.origin.trim().toLowerCase() : undefined;
    const isChannel = ['direct', 'organic_search', 'paid_search', 'social', 'referral', 'email', 'other'].includes(origin || '');

    const customer = this.customerRepository.create({
      tenantId,
      storeId,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email ? dto.email.trim().toLowerCase() : undefined,
      phone,
      status: dto.status || CustomerStatusEnum.ACTIVE,
      accountType: CustomerAccountTypeEnum.REGISTERED,
      source: dto.source || CustomerSourceEnum.MANUAL,
      registrationChannel: isChannel ? origin : (origin ? 'social' : 'direct'),
      registrationUtmSource: isChannel ? undefined : origin,
    });

    return this.customerRepository.save(customer);
  }
}
