import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  PurchaseCounterEntity,
  PurchaseCounterKindEnum,
} from '../entities/purchase-counter.entity';

const DEFAULT_PREFIXES: Record<PurchaseCounterKindEnum, string> = {
  [PurchaseCounterKindEnum.PO]: 'PO-',
  [PurchaseCounterKindEnum.BILL]: 'PUR-',
  [PurchaseCounterKindEnum.PAYMENT]: 'SPAY-',
};

/**
 * Hands out the next formatted document number for a store + kind and advances the counter
 * in the same transaction, so two concurrent writes cannot collide on a number. The counter
 * row is created on first use with a sensible prefix. Format: "{prefix}{YYYY}-{seq:0000}".
 */
@Injectable()
export class AllocatePurchaseNumberService {
  constructor(
    @InjectRepository(PurchaseCounterEntity)
    private readonly counterRepository: Repository<PurchaseCounterEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private format(prefix: string, sequence: number): string {
    const year = new Date().getFullYear();
    const padded = String(sequence).padStart(4, '0');
    return `${prefix}${year}-${padded}`;
  }

  private async ensureCounter(
    tenantId: string,
    storeId: string,
    kind: PurchaseCounterKindEnum,
  ): Promise<PurchaseCounterEntity> {
    const existing = await this.counterRepository.findOne({ where: { storeId, kind } });
    if (existing) return existing;

    return this.counterRepository.save(
      this.counterRepository.create({
        tenantId,
        storeId,
        kind,
        prefix: DEFAULT_PREFIXES[kind],
        nextSequence: 1,
      }),
    );
  }

  async execute(
    tenantId: string,
    storeId: string,
    kind: PurchaseCounterKindEnum,
  ): Promise<string> {
    await this.ensureCounter(tenantId, storeId, kind);

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PurchaseCounterEntity);
      const counter = await repo
        .createQueryBuilder('counter')
        .setLock('pessimistic_write')
        .where('counter.storeId = :storeId AND counter.kind = :kind', { storeId, kind })
        .getOne();

      if (!counter) {
        // ensureCounter ran just above; this only happens under a race we lost — retry once.
        const created = await this.ensureCounter(tenantId, storeId, kind);
        created.nextSequence += 1;
        await repo.save(created);
        return this.format(created.prefix, created.nextSequence - 1);
      }

      const allocated = counter.nextSequence;
      counter.nextSequence += 1;
      await repo.save(counter);
      return this.format(counter.prefix, allocated);
    });
  }
}
