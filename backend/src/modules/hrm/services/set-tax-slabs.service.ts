import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxSlabEntity } from '../entities/tax-slab.entity';
import { SetTaxSlabsDto } from '../dto/tax.dto';

@Injectable()
export class SetTaxSlabsService {
  constructor(
    @InjectRepository(TaxSlabEntity)
    private readonly taxSlabRepository: Repository<TaxSlabEntity>,
  ) {}

  /**
   * Replaces the whole slab set for a store + fiscal year in one call, matching the
   * "settings" shape (like leave policy) rather than exposing per-row CRUD — slabs are
   * always edited as a complete ladder, never one at a time.
   */
  async execute(tenantId: string, storeId: string, dto: SetTaxSlabsDto): Promise<TaxSlabEntity[]> {
    const sorted = [...dto.slabs].sort((a, b) => Number(a.minAmount) - Number(b.minAmount));

    for (let i = 0; i < sorted.length; i++) {
      const slab = sorted[i];
      if (slab.maxAmount !== undefined && Number(slab.maxAmount) <= Number(slab.minAmount)) {
        throw new BadRequestException(`Slab ${i + 1}: maxAmount must be greater than minAmount.`);
      }
      const next = sorted[i + 1];
      if (next && slab.maxAmount === undefined) {
        throw new BadRequestException(`Slab ${i + 1}: only the last (highest) slab may be open-ended.`);
      }
      if (next && Number(next.minAmount) !== Number(slab.maxAmount)) {
        throw new BadRequestException(`Slab ${i + 1} and slab ${i + 2} must be contiguous (no gap or overlap).`);
      }
    }

    await this.taxSlabRepository.delete({ storeId, fiscalYear: dto.fiscalYear });

    const entities = sorted.map((slab, index) =>
      this.taxSlabRepository.create({
        tenantId,
        storeId,
        fiscalYear: dto.fiscalYear,
        minAmount: slab.minAmount,
        maxAmount: slab.maxAmount,
        ratePercent: slab.ratePercent.toString(),
        sortOrder: index,
      }),
    );

    return this.taxSlabRepository.save(entities);
  }
}
