import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity, LeadStageEnum, LeadSourceEnum } from '../entities/lead.entity';
import { CustomerEntity, CustomerStatusEnum, CustomerAccountTypeEnum, CustomerSourceEnum } from '../entities/customer.entity';
import { CreateLeadDto } from '../dto/create-lead.dto';

@Injectable()
export class CreateLeadService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  private splitName(name: string): { firstName: string; lastName: string } {
    const trimmed = (name || '').trim();
    if (!trimmed) return { firstName: 'Guest', lastName: 'Lead' };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0].slice(0, 100), lastName: '-' };
    return {
      firstName: parts.slice(0, -1).join(' ').slice(0, 100),
      lastName: parts[parts.length - 1].slice(0, 100),
    };
  }

  async execute(tenantId: string, dto: CreateLeadDto, storeId?: string): Promise<LeadEntity> {
    const phone = dto.phone.trim();

    // 1. Check if customer already exists or create as a GUEST customer record
    let customer = await this.customerRepository.findOne({
      where: { tenantId, phone },
    });

    if (!customer) {
      const { firstName, lastName } = this.splitName(dto.name);
      const newCustomer = this.customerRepository.create({
        tenantId,
        storeId: storeId || undefined,
        firstName,
        lastName,
        phone,
        email: dto.email ? dto.email.trim().toLowerCase() : undefined,
        status: CustomerStatusEnum.GUEST,
        accountType: CustomerAccountTypeEnum.GUEST,
        source: CustomerSourceEnum.MANUAL,
      });
      customer = await this.customerRepository.save(newCustomer);
    }

    // 2. Create and persist Lead record linked to the customer
    const lead = this.leadRepository.create({
      tenantId,
      storeId,
      name: dto.name.trim(),
      phone,
      email: dto.email ? dto.email.trim().toLowerCase() : undefined,
      companyName: dto.companyName?.trim(),
      source: dto.source || LeadSourceEnum.WHATSAPP,
      stage: dto.stage || LeadStageEnum.NEW,
      estimatedValue: dto.estimatedValue || 0,
      leadScore: dto.leadScore ?? 60,
      notes: dto.notes,
      tags: dto.tags || [],
      assignedStaffId: dto.assignedStaffId,
      assignedStaffName: dto.assignedStaffName,
      convertedCustomerId: customer?.id,
    });

    return this.leadRepository.save(lead);
  }
}
