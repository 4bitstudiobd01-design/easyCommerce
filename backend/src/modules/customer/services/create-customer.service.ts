import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
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

    const customer = this.customerRepository.create({
      tenantId,
      storeId,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email ? dto.email.trim().toLowerCase() : undefined,
      phone: dto.phone.trim(),
      status: dto.status,
      source: dto.source,
    });

    return this.customerRepository.save(customer);
  }
}
