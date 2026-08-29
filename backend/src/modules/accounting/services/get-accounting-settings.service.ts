import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingSettingsEntity } from '../entities/accounting-settings.entity';

/**
 * Returns the store's accounting settings row, creating it with defaults on first access.
 * This is the entry point every accounting page hits, so it also doubles as the hook the
 * default chart-of-accounts seeder is triggered from (see SeedDefaultChartOfAccountsService,
 * called by the controller after this resolves when `chartSeeded` is false).
 */
@Injectable()
export class GetAccountingSettingsService {
  constructor(
    @InjectRepository(AccountingSettingsEntity)
    private readonly settingsRepository: Repository<AccountingSettingsEntity>,
  ) {}

  async execute(tenantId: string, storeId: string): Promise<AccountingSettingsEntity> {
    const existing = await this.settingsRepository.findOne({ where: { storeId } });
    if (existing) return existing;

    return this.settingsRepository.save(
      this.settingsRepository.create({
        tenantId,
        storeId,
        fiscalYearStartMonth: 7,
        baseCurrency: 'BDT',
        autoPostEnabled: true,
        allowDraftEntries: true,
        chartSeeded: false,
      }),
    );
  }
}
