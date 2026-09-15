import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MarketingEventLog } from '../entities/marketing-event-log.entity';
import { MarketingPixel } from '../entities/marketing-pixel.entity';
import { ListMarketingLogsDto } from '../dto/list-logs.dto';

export interface MarketingLogRow {
  id: string;
  pixelId: string | null;
  pixelLabel: string | null;
  provider: string | null;
  eventName: string;
  transport: string;
  source: string;
  status: string;
  httpStatus: number | null;
  errorMessage: string | null;
  orderRef: string | null;
  utmSource: string | null;
  createdAt: string;
}

@Injectable()
export class ListMarketingLogsService {
  constructor(
    @InjectRepository(MarketingEventLog)
    private readonly logRepository: Repository<MarketingEventLog>,
    @InjectRepository(MarketingPixel)
    private readonly pixelRepository: Repository<MarketingPixel>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: ListMarketingLogsDto,
  ): Promise<{ data: MarketingLogRow[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId and storeId are required');
    }

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const qb = this.logRepository
      .createQueryBuilder('log')
      .where('log.tenantId = :tenantId', { tenantId })
      .andWhere('log.storeId = :storeId', { storeId });

    if (dto.pixelId) qb.andWhere('log.pixelId = :pixelId', { pixelId: dto.pixelId });
    if (dto.provider) qb.andWhere('log.provider = :provider', { provider: dto.provider });
    if (dto.eventName) qb.andWhere('log.eventName = :eventName', { eventName: dto.eventName });
    if (dto.transport) qb.andWhere('log.transport = :transport', { transport: dto.transport });
    if (dto.status) qb.andWhere('log.status = :status', { status: dto.status });
    if (dto.dateFrom) qb.andWhere('log.createdAt >= :dateFrom', { dateFrom: dto.dateFrom });
    if (dto.dateTo) qb.andWhere('log.createdAt <= :dateTo', { dateTo: dto.dateTo });

    qb.orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();

    // Resolve pixel labels in one query.
    const pixelIds = Array.from(new Set(rows.map((r) => r.pixelId).filter((x): x is string => Boolean(x))));
    const labelById = new Map<string, string | null>();
    if (pixelIds.length > 0) {
      const pixels = await this.pixelRepository.find({
        where: { id: In(pixelIds) },
        select: ['id', 'label'],
      });
      for (const p of pixels) labelById.set(p.id, p.label);
    }

    return {
      data: rows.map((r) => ({
        id: r.id,
        pixelId: r.pixelId,
        pixelLabel: r.pixelId ? labelById.get(r.pixelId) ?? null : null,
        provider: r.provider,
        eventName: r.eventName,
        transport: r.transport,
        source: r.source,
        status: r.status,
        httpStatus: r.httpStatus,
        errorMessage: r.errorMessage,
        orderRef: r.orderRef,
        utmSource: r.utmSource,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
