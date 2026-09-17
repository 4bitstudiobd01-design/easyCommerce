import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountMappingEntity } from '../entities/account-mapping.entity';
import { AccountEntity } from '../entities/account.entity';
import { UpdateAccountMappingDto } from '../dto/settings.dto';

/**
 * Upserts one automation → GL account mapping for a store. A non-empty accountId is
 * validated against the store's chart of accounts; an empty/null value clears the mapping.
 */
@Injectable()
export class UpdateAccountMappingService {
  constructor(
    @InjectRepository(AccountMappingEntity)
    private readonly mappingRepository: Repository<AccountMappingEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: UpdateAccountMappingDto,
  ): Promise<AccountMappingEntity> {
    const accountId =
      typeof dto.accountId === 'string' && dto.accountId.trim() !== ''
        ? dto.accountId
        : null;

    if (accountId) {
      const account = await this.accountRepository.findOne({
        where: { id: accountId, storeId },
      });
      if (!account) {
        throw new NotFoundException('Account not found in this store.');
      }
    }

    const existing = await this.mappingRepository.findOne({
      where: { storeId, event: dto.event },
    });

    if (existing) {
      existing.accountId = accountId ?? undefined;
      return this.mappingRepository.save(existing);
    }

    return this.mappingRepository.save(
      this.mappingRepository.create({
        tenantId,
        storeId,
        event: dto.event,
        accountId: accountId ?? undefined,
      }),
    );
  }
}
