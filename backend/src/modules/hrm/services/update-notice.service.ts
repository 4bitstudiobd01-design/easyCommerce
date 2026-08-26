import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoticeEntity } from '../entities/notice.entity';
import { UpdateNoticeDto } from '../dto/notice.dto';

@Injectable()
export class UpdateNoticeService {
  constructor(
    @InjectRepository(NoticeEntity)
    private readonly noticeRepository: Repository<NoticeEntity>,
  ) {}

  async execute(storeId: string, noticeId: string, dto: UpdateNoticeDto): Promise<NoticeEntity> {
    const notice = await this.noticeRepository.findOne({ where: { id: noticeId, storeId } });
    if (!notice) {
      throw new NotFoundException('Notice not found.');
    }

    if (dto.title !== undefined) notice.title = dto.title;
    if (dto.body !== undefined) notice.body = dto.body;
    if (dto.priority !== undefined) notice.priority = dto.priority;
    if (dto.isPinned !== undefined) notice.isPinned = dto.isPinned;
    if (dto.expiresAt !== undefined) notice.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

    return this.noticeRepository.save(notice);
  }
}
