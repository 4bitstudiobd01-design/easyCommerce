import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity, LeadStageEnum, LeadSourceEnum } from '../entities/lead.entity';
import { CreateLeadDto } from '../dto/create-lead.dto';

@Injectable()
export class CreateLeadService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
  ) {}

  async execute(tenantId: string, dto: CreateLeadDto, storeId?: string): Promise<LeadEntity> {
    const lead = this.leadRepository.create({
      tenantId,
      storeId,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      companyName: dto.companyName,
      source: dto.source || LeadSourceEnum.WHATSAPP,
      stage: dto.stage || LeadStageEnum.NEW,
      estimatedValue: dto.estimatedValue || 0,
      leadScore: dto.leadScore ?? 60,
      notes: dto.notes,
      tags: dto.tags || [],
      assignedStaffId: dto.assignedStaffId,
      assignedStaffName: dto.assignedStaffName,
    });

    return this.leadRepository.save(lead);
  }
}
