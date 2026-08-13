import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerNoteEntity } from '../entities/customer-note.entity';

@Injectable()
export class DeleteCustomerNoteService {
  constructor(
    @InjectRepository(CustomerNoteEntity)
    private readonly noteRepository: Repository<CustomerNoteEntity>,
  ) {}

  async execute(noteId: string, customerId: string, tenantId: string): Promise<{ success: boolean }> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId, customerId, tenantId },
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found for this customer.`);
    }

    await this.noteRepository.remove(note);
    return { success: true };
  }
}
