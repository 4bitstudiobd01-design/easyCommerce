import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  NumberingRuleEntity,
  NumberingDocTypeEnum,
} from '../entities/numbering-rule.entity';

const DEFAULT_PREFIXES: Record<NumberingDocTypeEnum, string> = {
  [NumberingDocTypeEnum.JOURNAL_ENTRY]: 'JE-',
  [NumberingDocTypeEnum.EXPENSE]: 'EXP-',
  [NumberingDocTypeEnum.DEBIT_NOTE]: 'DN-',
  [NumberingDocTypeEnum.CREDIT_NOTE]: 'CN-',
};

/**
 * Hands out the next formatted document number for a store + doc type and advances the
 * counter in the same transaction, so two concurrent posts cannot collide on a number.
 * The numbering rule row is created on first use with sensible defaults.
 */
@Injectable()
export class AllocateNextNumberService {
  constructor(
    @InjectRepository(NumberingRuleEntity)
    private readonly ruleRepository: Repository<NumberingRuleEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private format(rule: NumberingRuleEntity, sequence: number): string {
    const yearSegment = rule.includeYear ? `${new Date().getFullYear()}-` : '';
    const padded = String(sequence).padStart(rule.padWidth, '0');
    return `${rule.prefix}${yearSegment}${padded}${rule.suffix}`;
  }

  async ensureRule(
    tenantId: string,
    storeId: string,
    docType: NumberingDocTypeEnum,
  ): Promise<NumberingRuleEntity> {
    const existing = await this.ruleRepository.findOne({ where: { storeId, docType } });
    if (existing) return existing;

    return this.ruleRepository.save(
      this.ruleRepository.create({
        tenantId,
        storeId,
        docType,
        prefix: DEFAULT_PREFIXES[docType],
        suffix: '',
        includeYear: true,
        padWidth: 4,
        nextSequence: 1,
      }),
    );
  }

  async execute(
    tenantId: string,
    storeId: string,
    docType: NumberingDocTypeEnum,
  ): Promise<string> {
    await this.ensureRule(tenantId, storeId, docType);

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(NumberingRuleEntity);
      const rule = await repo
        .createQueryBuilder('rule')
        .setLock('pessimistic_write')
        .where('rule.storeId = :storeId AND rule.docType = :docType', { storeId, docType })
        .getOne();

      if (!rule) {
        // ensureRule ran just above; this only happens under a race we lost — retry once.
        const created = await this.ensureRule(tenantId, storeId, docType);
        created.nextSequence += 1;
        await repo.save(created);
        return this.format(created, created.nextSequence - 1);
      }

      const allocated = rule.nextSequence;
      rule.nextSequence += 1;
      await repo.save(rule);
      return this.format(rule, allocated);
    });
  }
}
