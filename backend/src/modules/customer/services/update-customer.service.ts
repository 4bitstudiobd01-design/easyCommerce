import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

@Injectable()
export class UpdateCustomerService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateCustomerDto): Promise<CustomerEntity> {
    const customer = await this.customerRepository.findOne({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }

    if (dto.phone && dto.phone.trim() !== customer.phone) {
      const existingPhone = await this.customerRepository.findOne({
        where: { tenantId, phone: dto.phone.trim() },
      });
      if (existingPhone && existingPhone.id !== id) {
        throw new ConflictException(`Another customer with phone number ${dto.phone} already exists.`);
      }
      customer.phone = dto.phone.trim();
    }

    if (dto.email !== undefined) {
      const newEmail = dto.email ? dto.email.trim().toLowerCase() : null;
      if (newEmail && newEmail !== customer.email) {
        const existingEmail = await this.customerRepository.findOne({
          where: { tenantId, email: newEmail },
        });
        if (existingEmail && existingEmail.id !== id) {
          throw new ConflictException(`Another customer with email address ${dto.email} already exists.`);
        }
      }
      customer.email = newEmail || undefined;
    }

    if (dto.firstName !== undefined) customer.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) customer.lastName = dto.lastName.trim();
    if (dto.status !== undefined) customer.status = dto.status;
    if (dto.source !== undefined) customer.source = dto.source;

    return this.customerRepository.save(customer);
  }
}
