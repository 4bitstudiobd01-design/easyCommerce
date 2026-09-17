import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AccountMappingEntity,
  AccountMappingEventEnum,
} from '../entities/account-mapping.entity';

/**
 * Lists the store's automation → GL account mappings, one row per AccountMappingEventEnum.
 * The default-chart seeder pre-creates all twelve; this backfills any missing event
 * defensively (with a null accountId) so the settings page always renders the full set.
 */
@Injectable()
export class ListAccountMappingsService {
  constructor(
    @InjectRepository(AccountMappingEntity)
    private readonly mappingRepository: Repository<AccountMappingEntity>,
  ) {}

  async execute(storeId: string): Promise<AccountMappingEntity[]> {
    const existing = await this.mappingRepository.find({ where: { storeId } });
    const byEvent = new Map(existing.map((m) => [m.event, m]));

    const missing = Object.values(AccountMappingEventEnum).filter(
      (event) => !byEvent.has(event),
    );

    if (missing.length > 0) {
      const tenantId = existing[0]?.tenantId;
      if (tenantId) {
        const created = await this.mappingRepository.save(
          missing.map((event) =>
            this.mappingRepository.create({ tenantId, storeId, event, accountId: null }),
          ),
        );
        created.forEach((m) => byEvent.set(m.event, m));
      }
    }

    return Object.values(AccountMappingEventEnum)
      .map((event) => byEvent.get(event))
      .filter((m): m is AccountMappingEntity => m !== undefined)
      .sort((a, b) => a.event.localeCompare(b.event));
  }
}
