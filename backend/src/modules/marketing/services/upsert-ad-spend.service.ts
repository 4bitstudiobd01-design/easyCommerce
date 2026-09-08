import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingAdSpend } from '../entities/marketing-ad-spend.entity';
import { UpsertAdSpendDto } from '../dto/ad-spend.dto';

@Injectable()
export class UpsertAdSpendService {
  constructor(
    @InjectRepository(MarketingAdSpend)
    private readonly adSpendRepository: Repository<MarketingAdSpend>,
  ) {}

  async execute(tenantId: string, storeId: string, dto: UpsertAdSpendDto) {
    if (!tenantId || !storeId) {
      throw new BadRequestException('tenantId and storeId headers are required');
    }

    if (dto.periodEnd < dto.periodStart) {
      throw new BadRequestException('periodEnd must be on or after periodStart.');
    }

    let entry: MarketingAdSpend | null = null;

    if (dto.id) {
      entry = await this.adSpendRepository.findOne({
        where: { id: dto.id, tenantId, storeId },
      });
      if (!entry) {
        throw new NotFoundException('Ad spend entry not found.');
      }
    }

    const values = {
      tenantId,
      storeId,
      dimension: dto.dimension,
      dimensionValue: dto.dimensionValue.trim(),
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      amount: dto.amount.toFixed(2),
      currency: (dto.currency || 'BDT').toUpperCase(),
      note: dto.note?.trim() || null,
    };

    entry = entry
      ? this.adSpendRepository.merge(entry, values)
      : this.adSpendRepository.create(values);

    const saved = await this.adSpendRepository.save(entry);

    return {
      message: dto.id ? 'Ad spend updated.' : 'Ad spend recorded.',
      data: {
        id: saved.id,
        dimension: saved.dimension,
        dimensionValue: saved.dimensionValue,
        periodStart: saved.periodStart,
        periodEnd: saved.periodEnd,
        amount: Number(saved.amount),
        currency: saved.currency,
        note: saved.note,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    };
  }
}
