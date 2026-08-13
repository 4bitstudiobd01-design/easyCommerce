import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerNoteEntity } from '../entities/customer-note.entity';
import { CustomerEntity } from '../entities/customer.entity';
import { CreateCustomerNoteDto } from '../dto/create-customer-note.dto';
import { RecordCustomerActivityService } from './record-customer-activity.service';

@Injectable()
export class CreateCustomerNoteService {
  constructor(
    @InjectRepository(CustomerNoteEntity)
    private readonly noteRepository: Repository<CustomerNoteEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly recordActivityService: RecordCustomerActivityService,
  ) {}

  async execute(
    customerId: string,
    tenantId: string,
    dto: CreateCustomerNoteDto,
    authorId?: string,
    authorName = 'Merchant',
    storeId?: string,
  ): Promise<CustomerNoteEntity> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }

    const note = this.noteRepository.create({
      tenantId,
      storeId: storeId || customer.storeId,
      customerId,
      authorId,
      authorName,
      content: dto.content,
    });

    const savedNote = await this.noteRepository.save(note);

    // Record activity event
    await this.recordActivityService.execute({
      tenantId,
      storeId: storeId || customer.storeId,
      customerId,
      eventType: 'NOTE_ADDED',
      title: 'Internal Note Added',
      description: dto.content.length > 80 ? `${dto.content.substring(0, 80)}...` : dto.content,
      actorName: authorName,
      metadata: { noteId: savedNote.id },
    });

    return savedNote;
  }
}
