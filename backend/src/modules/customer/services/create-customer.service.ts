import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity, CustomerSourceEnum } from '../entities/customer.entity';
import { CreateCustomerDto } from '../dto/create-customer.dto';

@Injectable()
export class CreateCustomerService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  async execute(tenantId: string, dto: CreateCustomerDto, storeId?: string): Promise<CustomerEntity> {
    const existingPhone = await this.customerRepository.findOne({
      where: { tenantId, phone: dto.phone.trim() },
    });

    if (existingPhone) {
      throw new ConflictException(`A customer with phone number ${dto.phone} already exists in your store.`);
    }

    if (dto.email && dto.email.trim()) {
      const existingEmail = await this.customerRepository.findOne({
        where: { tenantId, email: dto.email.trim().toLowerCase() },
      });
      if (existingEmail) {
        throw new ConflictException(`A customer with email address ${dto.email} already exists in your store.`);
      }
    }

    const origin = dto.origin ? dto.origin.trim().toLowerCase() : undefined;
    const isChannel = ['direct', 'organic_search', 'paid_search', 'social', 'referral', 'email', 'other'].includes(origin || '');

    const customer = this.customerRepository.create({
      tenantId,
      storeId,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email ? dto.email.trim().toLowerCase() : undefined,
      phone: dto.phone.trim(),
      status: dto.status,
      source: dto.source || CustomerSourceEnum.MANUAL,
      registrationChannel: isChannel ? origin : (origin ? 'social' : 'direct'),
      registrationUtmSource: isChannel ? undefined : origin,
    });

    return this.customerRepository.save(customer);
  }
}
