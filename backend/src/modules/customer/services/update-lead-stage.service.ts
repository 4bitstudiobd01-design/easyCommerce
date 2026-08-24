import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity, LeadStageEnum } from '../entities/lead.entity';

@Injectable()
export class UpdateLeadStageService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    newStage: LeadStageEnum,
    lostReason?: string,
  ): Promise<LeadEntity> {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    lead.stage = newStage;
    if (lostReason !== undefined) {
      lead.lostReason = lostReason;
    }

    // When lead moves to CONTACTED or closed (WON/LOST), the scheduled follow-up is completed
    if (
      newStage === LeadStageEnum.CONTACTED ||
      newStage === LeadStageEnum.WON ||
      newStage === LeadStageEnum.LOST
    ) {
      lead.nextFollowUpAt = null;
      lead.followUpNote = undefined;
      lead.followUpStatus = 'COMPLETED';
    }

    return this.leadRepository.save(lead);
  }
}

