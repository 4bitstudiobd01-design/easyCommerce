import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceTransferEntity } from '../entities/finance-transfer.entity';

@Injectable()
export class DeleteAccountService {
  constructor(
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceTransferEntity)
    private readonly transferRepository: Repository<FinanceTransferEntity>,
  ) {}

  async execute(
    storeId: string,
    accountId: string,
  ): Promise<{ success: boolean; message: string; deactivated?: boolean }> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, storeId },
    });

    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    // Check if account has any associated transactions or transfers
    const txnCount = await this.transactionRepository.count({
      where: [{ storeId, accountId }, { storeId, toAccountId: accountId }],
    });

    const transferCount = await this.transferRepository.count({
      where: [{ storeId, fromAccountId: accountId }, { storeId, toAccountId: accountId }],
    });

    if (txnCount > 0 || transferCount > 0) {
      // Deactivate to maintain ledger integrity
      account.isActive = false;
      await this.accountRepository.save(account);
      return {
        success: true,
        deactivated: true,
        message: 'Account has transaction history and has been archived/deactivated to preserve your financial records.',
      };
    }

    await this.accountRepository.remove(account);
    return {
      success: true,
      deactivated: false,
      message: 'Account removed successfully.',
    };
  }
}
