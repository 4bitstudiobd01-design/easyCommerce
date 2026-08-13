import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerNoteEntity } from '../entities/customer-note.entity';
import { CustomerEntity } from '../entities/customer.entity';

@Injectable()
export class ListCustomerNotesService {
  constructor(
    @InjectRepository(CustomerNoteEntity)
    private readonly noteRepository: Repository<CustomerNoteEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  async execute(customerId: string, tenantId: string): Promise<CustomerNoteEntity[]> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }

    return this.noteRepository.find({
      where: { customerId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }
}
