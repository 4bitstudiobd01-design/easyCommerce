import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { NoticeEntity } from '../entities/notice.entity';
import { ListNoticesQueryDto } from '../dto/notice.dto';

@Injectable()
export class ListNoticesService {
  constructor(
    @InjectRepository(NoticeEntity)
    private readonly noticeRepository: Repository<NoticeEntity>,
  ) {}

  async execute(storeId: string, query: ListNoticesQueryDto): Promise<NoticeEntity[]> {
    if (query.includeExpired) {
      return this.noticeRepository.find({
        where: { storeId },
        order: { isPinned: 'DESC', createdAt: 'DESC' },
      });
    }

    const now = new Date();
    const [unexpiring, active] = await Promise.all([
      this.noticeRepository.find({ where: { storeId, expiresAt: IsNull() } }),
      this.noticeRepository.find({ where: { storeId, expiresAt: MoreThan(now) } }),
    ]);

    return [...unexpiring, ...active].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}
