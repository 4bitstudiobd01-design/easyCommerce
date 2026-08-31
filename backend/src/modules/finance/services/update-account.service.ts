import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { UpdateFinanceAccountDto } from '../dto/account.dto';

@Injectable()
export class UpdateAccountService {
  constructor(
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
  ) {}

  async execute(
    storeId: string,
    accountId: string,
    dto: UpdateFinanceAccountDto,
  ): Promise<FinanceAccountEntity> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, storeId },
    });

    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    if (dto.isDefault) {
      await this.accountRepository.update({ storeId }, { isDefault: false });
    }

    Object.assign(account, dto);
    return this.accountRepository.save(account);
  }
}
