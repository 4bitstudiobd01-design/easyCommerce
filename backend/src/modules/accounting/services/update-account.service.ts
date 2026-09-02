import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from '../entities/account.entity';
import { UpdateAccountDto } from '../dto/account.dto';

/**
 * Patches the mutable fields of a chart-of-accounts entry. `code` and `type` are immutable
 * once an account exists (they are not part of UpdateAccountDto). Accounts can be
 * deactivated here; deletion goes through DeleteAccountService.
 */
@Injectable()
export class UpdateAccountService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  async execute(
    storeId: string,
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<AccountEntity> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, storeId },
    });
    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === accountId) {
        throw new BadRequestException('An account cannot be its own parent.');
      }
      const parent = await this.accountRepository.findOne({
        where: { id: dto.parentId, storeId },
      });
      if (!parent) {
        throw new BadRequestException('Parent account not found in this store.');
      }
    }

    if (dto.name !== undefined) account.name = dto.name;
    if (dto.description !== undefined) account.description = dto.description;
    if (dto.parentId !== undefined) {
      account.parentId = dto.parentId === null ? undefined : dto.parentId;
    }
    if (dto.openingBalance !== undefined) {
      account.openingBalance = dto.openingBalance.toFixed(2);
    }
    if (dto.isActive !== undefined) account.isActive = dto.isActive;

    return this.accountRepository.save(account);
  }
}
