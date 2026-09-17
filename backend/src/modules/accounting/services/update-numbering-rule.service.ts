import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NumberingRuleEntity } from '../entities/numbering-rule.entity';
import { UpdateNumberingRuleDto } from '../dto/settings.dto';
import { AllocateNextNumberService } from './allocate-next-number.service';
import {
  buildNumberingSample,
  NumberingRuleWithSample,
} from './list-numbering-rules.service';

/**
 * Patches one document numbering rule for a store. Only the supplied fields are touched.
 * `nextSequence` is consumed by live document allocation — lowering it can collide with an
 * already-issued number; that is the merchant's call, so it is persisted as given (the DTO
 * already floors it at 1).
 */
@Injectable()
export class UpdateNumberingRuleService {
  constructor(
    @InjectRepository(NumberingRuleEntity)
    private readonly ruleRepository: Repository<NumberingRuleEntity>,
    private readonly allocateNextNumberService: AllocateNextNumberService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: UpdateNumberingRuleDto,
  ): Promise<NumberingRuleWithSample> {
    const rule = await this.allocateNextNumberService.ensureRule(
      tenantId,
      storeId,
      dto.docType,
    );

    if (dto.prefix !== undefined) rule.prefix = dto.prefix;
    if (dto.suffix !== undefined) rule.suffix = dto.suffix;
    if (dto.includeYear !== undefined) rule.includeYear = dto.includeYear;
    if (dto.padWidth !== undefined) rule.padWidth = dto.padWidth;
    if (dto.nextSequence !== undefined) rule.nextSequence = dto.nextSequence;

    const saved = await this.ruleRepository.save(rule);
    return Object.assign(saved, { sample: buildNumberingSample(saved) });
  }
}
