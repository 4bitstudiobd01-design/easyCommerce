import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from '../entities/account.entity';
import { JournalLineEntity } from '../entities/journal-line.entity';

/**
 * Hard-deletes a merchant-defined account. System accounts (seeded default chart) and any
 * account that already carries postings can only be deactivated, never removed, so that
 * historical vouchers keep resolving.
 */
@Injectable()
export class DeleteAccountService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(JournalLineEntity)
    private readonly journalLineRepository: Repository<JournalLineEntity>,
  ) {}

  async execute(
    storeId: string,
    accountId: string,
  ): Promise<{ success: boolean; message: string }> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, storeId },
    });
    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    if (account.isSystem) {
      throw new BadRequestException(
        'System accounts cannot be deleted. Deactivate the account instead.',
      );
    }

    const postingCount = await this.journalLineRepository.count({
      where: { storeId, accountId },
    });
    if (postingCount > 0) {
      throw new BadRequestException(
        'This account has journal postings and cannot be deleted. Deactivate it instead.',
      );
    }

    await this.accountRepository.remove(account);
    return { success: true, message: 'Account deleted successfully.' };
  }
}
