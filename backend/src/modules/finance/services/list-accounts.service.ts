import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceAccountEntity } from '../entities/finance-account.entity';

@Injectable()
export class ListAccountsService {
  constructor(
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
  ) {}

  async execute(storeId: string) {
    const accounts = await this.accountRepository.find({
      where: { storeId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });

    const totalBalance = accounts
      .filter((a) => a.isActive)
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);

    return {
      items: accounts,
      totalBalance,
    };
  }
}
