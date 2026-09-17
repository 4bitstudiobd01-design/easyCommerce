import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from '../entities/account.entity';

/**
 * Flat, code-ordered list of a store's accounts. The Chart of Accounts slice groups these
 * by type for its tree view; other slices use it to populate account pickers.
 */
@Injectable()
export class ListAccountsService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  async execute(
    storeId: string,
    opts: { activeOnly?: boolean } = {},
  ): Promise<AccountEntity[]> {
    return this.accountRepository.find({
      where: opts.activeOnly ? { storeId, isActive: true } : { storeId },
      order: { code: 'ASC' },
    });
  }
}
