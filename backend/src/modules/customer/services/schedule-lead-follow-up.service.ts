import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity } from '../entities/lead.entity';

@Injectable()
export class ScheduleLeadFollowUpService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    followUpAt: string | null,
    note?: string,
  ): Promise<LeadEntity> {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    lead.nextFollowUpAt = followUpAt ? new Date(followUpAt) : null;
    if (note !== undefined) {
      lead.followUpNote = note;
    }
    lead.followUpStatus = followUpAt ? 'PENDING' : undefined;

    return this.leadRepository.save(lead);
  }
}
