import { Injectable } from '@nestjs/common';
import {
  NumberingRuleEntity,
  NumberingDocTypeEnum,
} from '../entities/numbering-rule.entity';
import { AllocateNextNumberService } from './allocate-next-number.service';

export type NumberingRuleWithSample = NumberingRuleEntity & { sample: string };

/**
 * Builds the sample document number a rule would issue next, matching the exact format
 * AllocateNextNumberService produces.
 */
export function buildNumberingSample(rule: NumberingRuleEntity): string {
  const yearSegment = rule.includeYear ? `${new Date().getFullYear()}-` : '';
  const padded = String(rule.nextSequence).padStart(rule.padWidth, '0');
  return `${rule.prefix}${yearSegment}${padded}${rule.suffix}`;
}

/**
 * Returns all four document numbering rules for a store, ensuring each row exists first
 * (they are otherwise created lazily on first document allocation). Each row carries a
 * computed `sample` preview of the next number it would hand out.
 */
@Injectable()
export class ListNumberingRulesService {
  constructor(private readonly allocateNextNumberService: AllocateNextNumberService) {}

  async execute(
    tenantId: string,
    storeId: string,
  ): Promise<NumberingRuleWithSample[]> {
    const docTypes = Object.values(NumberingDocTypeEnum);

    const rules = await Promise.all(
      docTypes.map((docType) =>
        this.allocateNextNumberService.ensureRule(tenantId, storeId, docType),
      ),
    );

    return rules
      .sort((a, b) => a.docType.localeCompare(b.docType))
      .map((rule) => Object.assign(rule, { sample: buildNumberingSample(rule) }));
  }
}
