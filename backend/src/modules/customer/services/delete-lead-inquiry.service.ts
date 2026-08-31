import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity } from '../entities/lead.entity';

@Injectable()
export class DeleteLeadInquiryService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
  ) {}

  async execute(id: string, tenantId: string, inquiryId: string): Promise<LeadEntity> {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    if (Array.isArray(lead.inquiries)) {
      lead.inquiries = lead.inquiries.filter((inq) => inq.id !== inquiryId);
      lead.notes = lead.inquiries.length > 0 ? lead.inquiries[0].note : '';
    }

    return this.leadRepository.save(lead);
  }
}
