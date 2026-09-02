import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AccountMappingEntity,
  AccountMappingEventEnum,
} from '../../accounting/entities/account-mapping.entity';
import { AccountingSettingsEntity } from '../../accounting/entities/accounting-settings.entity';

/**
 * Read-only access to the accounting module's account mappings and store settings, so the
 * bill / supplier-payment services can resolve which GL account an event posts to and
 * whether auto-posting is switched on — without widening AccountingModule's exports.
 */
@Injectable()
export class PurchasePostingHelper {
  constructor(
    @InjectRepository(AccountMappingEntity)
    private readonly mappingRepository: Repository<AccountMappingEntity>,
    @InjectRepository(AccountingSettingsEntity)
    private readonly settingsRepository: Repository<AccountingSettingsEntity>,
  ) {}

  async autoPostEnabled(storeId: string): Promise<boolean> {
    const settings = await this.settingsRepository.findOne({ where: { storeId } });
    return settings ? settings.autoPostEnabled : true;
  }

  async resolveMappedAccountId(
    storeId: string,
    event: AccountMappingEventEnum,
  ): Promise<string | undefined> {
    const mapping = await this.mappingRepository.findOne({ where: { storeId, event } });
    return mapping?.accountId ?? undefined;
  }

  async requireMappedAccountId(
    storeId: string,
    event: AccountMappingEventEnum,
    label: string,
  ): Promise<string> {
    const accountId = await this.resolveMappedAccountId(storeId, event);
    if (!accountId) {
      throw new BadRequestException(
        `Configure the ${label} account mapping in Accounting settings.`,
      );
    }
    return accountId;
  }
}
