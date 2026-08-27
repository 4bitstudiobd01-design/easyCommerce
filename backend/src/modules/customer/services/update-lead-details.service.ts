import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity } from '../entities/lead.entity';
import { UpdateLeadDetailsDto } from '../dto/update-lead.dto';

@Injectable()
export class UpdateLeadDetailsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateLeadDetailsDto): Promise<LeadEntity> {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    if (dto.notes !== undefined) {
      lead.notes = dto.notes;
    }
    if (dto.estimatedValue !== undefined) {
      lead.estimatedValue = dto.estimatedValue;
    }

    return this.leadRepository.save(lead);
  }
}
