import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { CreateFinanceAccountDto } from '../dto/account.dto';

@Injectable()
export class CreateAccountService {
  constructor(
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: CreateFinanceAccountDto,
  ): Promise<FinanceAccountEntity> {
    if (dto.isDefault) {
      await this.accountRepository.update({ storeId }, { isDefault: false });
    }

    const startingBalance = dto.startingBalance || 0;
    const account = this.accountRepository.create({
      tenantId,
      storeId,
      name: dto.name,
      type: dto.type,
      accountNumber: dto.accountNumber,
      bankOrProviderName: dto.bankOrProviderName,
      currency: dto.currency || 'BDT',
      startingBalance: String(startingBalance),
      currentBalance: String(startingBalance),
      isDefault: dto.isDefault || false,
      isActive: true,
      notes: dto.notes,
    });

    return this.accountRepository.save(account);
  }
}
