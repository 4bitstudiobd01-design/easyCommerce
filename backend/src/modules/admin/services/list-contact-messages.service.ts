import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessageEntity } from '../entities/contact-message.entity';

@Injectable()
export class ListContactMessagesService {
  constructor(
    @InjectRepository(ContactMessageEntity)
    private readonly contactMessageRepository: Repository<ContactMessageEntity>,
  ) {}

  async execute(): Promise<ContactMessageEntity[]> {
    return this.contactMessageRepository.find({ order: { createdAt: 'DESC' } });
  }
}
