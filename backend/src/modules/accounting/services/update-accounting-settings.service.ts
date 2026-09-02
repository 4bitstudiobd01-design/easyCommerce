import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingSettingsEntity } from '../entities/accounting-settings.entity';
import { GetAccountingSettingsService } from './get-accounting-settings.service';
import { UpdateAccountingSettingsDto } from '../dto/settings.dto';

/**
 * Patches the store's accounting settings row. baseCurrency is intentionally not editable
 * here — it is fixed per store once transactions exist.
 */
@Injectable()
export class UpdateAccountingSettingsService {
  constructor(
    @InjectRepository(AccountingSettingsEntity)
    private readonly settingsRepository: Repository<AccountingSettingsEntity>,
    private readonly getAccountingSettingsService: GetAccountingSettingsService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: UpdateAccountingSettingsDto,
  ): Promise<AccountingSettingsEntity> {
    const settings = await this.getAccountingSettingsService.execute(tenantId, storeId);

    if (dto.fiscalYearStartMonth !== undefined) {
      settings.fiscalYearStartMonth = dto.fiscalYearStartMonth;
    }
    if (dto.autoPostEnabled !== undefined) {
      settings.autoPostEnabled = dto.autoPostEnabled;
    }
    if (dto.allowDraftEntries !== undefined) {
      settings.allowDraftEntries = dto.allowDraftEntries;
    }

    return this.settingsRepository.save(settings);
  }
}
