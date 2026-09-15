import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { MarketingAdSpend } from '../entities/marketing-ad-spend.entity';
import { ListAdSpendQueryDto } from '../dto/ad-spend.dto';

@Injectable()
export class ListAdSpendService {
  constructor(
    @InjectRepository(MarketingAdSpend)
    private readonly adSpendRepository: Repository<MarketingAdSpend>,
  ) {}

  async execute(tenantId: string, storeId: string, query: ListAdSpendQueryDto) {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId and storeId headers are required');
    }

    const where: Record<string, unknown> = { tenantId, storeId };
    if (query.dimension) {
      where.dimension = query.dimension;
    }
    // Overlap filter: an entry is in range when its period intersects [dateFrom, dateTo].
    if (query.dateFrom) {
      where.periodEnd = MoreThanOrEqual(query.dateFrom);
    }
    if (query.dateTo) {
      where.periodStart = LessThanOrEqual(query.dateTo);
    }

    const rows = await this.adSpendRepository.find({
      where,
      order: { periodStart: 'DESC', createdAt: 'DESC' },
    });

    return rows.map((r) => ({
      id: r.id,
      dimension: r.dimension,
      dimensionValue: r.dimensionValue,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      amount: Number(r.amount),
      currency: r.currency,
      note: r.note,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }
}
