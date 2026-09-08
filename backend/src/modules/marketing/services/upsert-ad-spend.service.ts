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

    const dimensionValue = dto.dimensionValue.trim();
    let entry: MarketingAdSpend | null = null;

    if (dto.id) {
      entry = await this.adSpendRepository.findOne({
        where: { id: dto.id, tenantId, storeId },
      });
      if (!entry) {
        throw new NotFoundException('Ad spend entry not found.');
      }
    } else {
      // No id: treat an existing entry for the same (dimension, value, exact period)
      // as the one to overwrite, so saving the same month twice edits it in place
      // rather than creating a duplicate.
      entry = await this.adSpendRepository.findOne({
        where: {
          tenantId,
          storeId,
          dimension: dto.dimension,
          dimensionValue,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
        },
      });
    }

    const values = {
      tenantId,
      storeId,
      dimension: dto.dimension,
      dimensionValue,
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      amount: dto.amount.toFixed(2),
      currency: (dto.currency || 'BDT').toUpperCase(),
      note: dto.note?.trim() || null,
    };

    entry = entry
      ? this.adSpendRepository.merge(entry, values)
      : this.adSpendRepository.create(values);

    const isUpdate = Boolean(entry.id);
    const saved = await this.adSpendRepository.save(entry);

    return {
      message: isUpdate ? 'Ad spend updated.' : 'Ad spend recorded.',
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
