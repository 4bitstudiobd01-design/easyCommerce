import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { LeadEntity, LeadInquiryItem } from '../entities/lead.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { AddLeadInquiryDto } from '../dto/add-lead-inquiry.dto';

@Injectable()
export class AddLeadInquiryService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    userId: string,
    dto: AddLeadInquiryDto,
  ): Promise<LeadEntity> {
    const lead = await this.leadRepository.findOne({
      where: { id, tenantId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    let authorName = dto.authorName?.trim();
    let authorRole = dto.authorRole?.trim();
    const authorId = dto.authorId || userId || user?.id;

    if (!authorName || authorName === 'Admin') {
      authorName = user?.fullName || user?.email || 'Store Staff';
    }

    if (!authorRole || authorRole === 'Admin') {
      authorRole =
        user?.role === 'STORE_OWNER'
          ? 'Merchant'
          : user?.role === 'SUPER_ADMIN'
          ? 'Admin'
          : 'Staff';
    }

    const newInquiry: LeadInquiryItem = {
      id: randomUUID(),
      authorName: authorName || 'Staff Member',
      authorRole: authorRole || 'Staff',
      authorId,
      note: dto.note.trim(),
      createdAt: new Date().toISOString(),
    };

    const existingInquiries: LeadInquiryItem[] = Array.isArray(lead.inquiries)
      ? [...lead.inquiries]
      : [];

    // If inquiries array is empty but legacy notes exists, add legacy notes as original inquiry
    if (existingInquiries.length === 0 && lead.notes) {
      existingInquiries.push({
        id: randomUUID(),
        authorName: lead.assignedStaffName || 'Initial Requirement',
        authorRole: 'Initial Inquiry',
        note: lead.notes,
        createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString() : new Date().toISOString(),
      });
    }

    lead.inquiries = [newInquiry, ...existingInquiries];
    // Keep notes updated with latest note
    lead.notes = dto.note.trim();

    return this.leadRepository.save(lead);
  }
}
