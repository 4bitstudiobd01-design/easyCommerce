import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoticeEntity, NoticePriorityEnum } from '../entities/notice.entity';
import { CreateNoticeDto } from '../dto/notice.dto';

@Injectable()
export class CreateNoticeService {
  constructor(
    @InjectRepository(NoticeEntity)
    private readonly noticeRepository: Repository<NoticeEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, createdByUserId: string, dto: CreateNoticeDto): Promise<NoticeEntity> {
    return this.noticeRepository.save(
      this.noticeRepository.create({
        tenantId,
        storeId,
        title: dto.title,
        body: dto.body,
        priority: dto.priority ?? NoticePriorityEnum.NORMAL,
        isPinned: dto.isPinned ?? false,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        createdByUserId,
      }),
    );
  }
}
