import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoticeEntity } from '../entities/notice.entity';

@Injectable()
export class DeleteNoticeService {
  constructor(
    @InjectRepository(NoticeEntity)
    private readonly noticeRepository: Repository<NoticeEntity>,
  ) {}

  async execute(storeId: string, noticeId: string): Promise<void> {
    const notice = await this.noticeRepository.findOne({ where: { id: noticeId, storeId } });
    if (!notice) {
      throw new NotFoundException('Notice not found.');
    }

    await this.noticeRepository.remove(notice);
  }
}
