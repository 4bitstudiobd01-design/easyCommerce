import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AccountEntity,
  AccountTypeEnum,
  NormalBalanceEnum,
} from '../entities/account.entity';
import { CreateAccountDto } from '../dto/account.dto';

/**
 * Adds a merchant-defined account to a store's chart of accounts. Codes are unique per
 * store; the normal-balance side is derived from the account type when the caller does not
 * pin it explicitly (ASSET/EXPENSE are DEBIT-normal, the rest CREDIT-normal).
 */
@Injectable()
export class CreateAccountService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: CreateAccountDto,
  ): Promise<AccountEntity> {
    const existing = await this.accountRepository.findOne({
      where: { storeId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`An account with code "${dto.code}" already exists.`);
    }

    if (dto.parentId) {
      const parent = await this.accountRepository.findOne({
        where: { id: dto.parentId, storeId },
      });
      if (!parent) {
        throw new BadRequestException('Parent account not found in this store.');
      }
    }

    const normalBalance =
      dto.normalBalance ??
      (dto.type === AccountTypeEnum.ASSET || dto.type === AccountTypeEnum.EXPENSE
        ? NormalBalanceEnum.DEBIT
        : NormalBalanceEnum.CREDIT);

    return this.accountRepository.save(
      this.accountRepository.create({
        tenantId,
        storeId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        normalBalance,
        parentId: dto.parentId,
        description: dto.description,
        openingBalance:
          dto.openingBalance !== undefined ? dto.openingBalance.toFixed(2) : '0',
        isSystem: false,
        isActive: true,
      }),
    );
  }
}
