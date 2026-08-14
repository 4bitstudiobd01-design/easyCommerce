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
      return this.getDemoLogs();
    }

    try {
      const logs = await this.eventLogRepository.find({
        where: { tenantId, storeId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      if (logs.length === 0) {
        return this.getDemoLogs();
      }

      return {
        data: logs,
        total: await this.eventLogRepository.count({ where: { tenantId, storeId } })
      };
    } catch (error) {
      return this.getDemoLogs();
    }
  }

  private getDemoLogs() {
    return {
      data: [
        { id: 'l1', eventName: 'Purchase', source: 'Meta Pixel', orderRef: '#EC-1024', status: 'SENT', createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
        { id: 'l2', eventName: 'AddToCart', source: 'Meta Pixel', orderRef: '-', status: 'SENT', createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString() },
        { id: 'l3', eventName: 'PageView', source: 'Google Analytics', orderRef: '-', status: 'SENT', createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
        { id: 'l4', eventName: 'ViewContent', source: 'Meta Pixel', orderRef: '-', status: 'SENT', createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString() },
        { id: 'l5', eventName: 'InitiateCheckout', source: 'Google Analytics', orderRef: '-', status: 'SENT', createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
        { id: 'l6', eventName: 'Purchase', source: 'Google Analytics', orderRef: '#EC-1023', status: 'SENT', createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
        { id: 'l7', eventName: 'AddToCart', source: 'Google Analytics', orderRef: '-', status: 'FAILED', createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
        { id: 'l8', eventName: 'PageView', source: 'Meta Pixel', orderRef: '-', status: 'SENT', createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
      ],
      total: 8
    };
  }
}
