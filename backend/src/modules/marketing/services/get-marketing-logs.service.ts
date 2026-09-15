import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingEventLog } from '../entities/marketing-event-log.entity';

@Injectable()
export class GetMarketingLogsService {
  constructor(
    @InjectRepository(MarketingEventLog)
    private readonly eventLogRepository: Repository<MarketingEventLog>,
  ) {}

  async execute(tenantId: string, storeId: string, limit = 10, offset = 0) {
    if (!tenantId || !storeId) {
      return { data: [], total: 0 };
    }

    try {
      const [logs, total] = await this.eventLogRepository.findAndCount({
        where: { tenantId, storeId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      return {
        data: logs,
        total,
      };
    } catch {
      return { data: [], total: 0 };
    }
  }
}
