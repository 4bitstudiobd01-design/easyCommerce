import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceCategoryEntity } from '../entities/finance-category.entity';
import { UserEntity, UserRoleEnum } from '../../user/entities/user.entity';
import { UpdateIncomeDto } from '../dto/transaction.dto';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
} from '../enums/finance.enums';

@Injectable()
export class UpdateIncomeService {
  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceCategoryEntity)
    private readonly categoryRepository: Repository<FinanceCategoryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    storeId: string,
    id: string,
    userId: string,
    dto: UpdateIncomeDto,
  ): Promise<FinanceTransactionEntity> {
    const txn = await this.transactionRepository.findOne({
      where: { id, storeId, type: FinanceTransactionTypeEnum.INCOME },
      relations: ['account', 'category'],
    });

    if (!txn) {
      throw new NotFoundException('Income transaction not found.');
    }

    // Check if editing a past month income - only Admin/Owner allowed
    const txnDate = new Date(txn.transactionDate || (txn as any).createdAt);
    const now = new Date();
    const isPastMonth =
      txnDate.getFullYear() < now.getFullYear() ||
      (txnDate.getFullYear() === now.getFullYear() && txnDate.getMonth() < now.getMonth());

    if (isPastMonth && userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const isAdmin =
        user?.role === UserRoleEnum.SUPER_ADMIN ||
        user?.role === UserRoleEnum.STORE_OWNER;
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only administrators can edit financial income records from previous months.',
        );
      }
    }

    const oldAmount = Number(txn.amount || 0);
    const newAmount = dto.amount !== undefined ? Number(dto.amount) : oldAmount;
    if (newAmount <= 0) {
      throw new BadRequestException('Income amount must be greater than 0.');
    }

    const oldAccountId = txn.accountId;
    const newAccountId = dto.accountId !== undefined ? dto.accountId : oldAccountId;

    return this.dataSource.transaction(async (manager) => {
      // Handle account balance adjustments if transaction was completed
      if (txn.status === FinanceTransactionStatusEnum.COMPLETED) {
        if (oldAccountId && oldAccountId !== newAccountId) {
          // Revert addition on old account (subtract old amount)
          const oldAcc = await manager.findOne(FinanceAccountEntity, {
            where: { id: oldAccountId, storeId },
          });
          if (oldAcc) {
            oldAcc.currentBalance = String(Number(oldAcc.currentBalance || 0) - oldAmount);
            await manager.save(FinanceAccountEntity, oldAcc);
          }
          // Apply addition on new account (add new amount)
          if (newAccountId) {
            const newAcc = await manager.findOne(FinanceAccountEntity, {
              where: { id: newAccountId, storeId },
            });
            if (newAcc) {
              newAcc.currentBalance = String(Number(newAcc.currentBalance || 0) + newAmount);
              await manager.save(FinanceAccountEntity, newAcc);
            }
          }
        } else if (oldAccountId && oldAccountId === newAccountId) {
          // Account didn't change, but amount might have
          const diff = newAmount - oldAmount;
          if (diff !== 0) {
            const acc = await manager.findOne(FinanceAccountEntity, {
              where: { id: oldAccountId, storeId },
            });
            if (acc) {
              acc.currentBalance = String(Number(acc.currentBalance || 0) + diff);
              await manager.save(FinanceAccountEntity, acc);
            }
          }
        } else if (!oldAccountId && newAccountId) {
          // Was unassigned, now linked to an account
          const newAcc = await manager.findOne(FinanceAccountEntity, {
            where: { id: newAccountId, storeId },
          });
          if (newAcc) {
            newAcc.currentBalance = String(Number(newAcc.currentBalance || 0) + newAmount);
            await manager.save(FinanceAccountEntity, newAcc);
          }
        } else if (oldAccountId && !newAccountId) {
          // Was linked to an account, now unassigned
          const oldAcc = await manager.findOne(FinanceAccountEntity, {
            where: { id: oldAccountId, storeId },
          });
          if (oldAcc) {
            oldAcc.currentBalance = String(Number(oldAcc.currentBalance || 0) - oldAmount);
            await manager.save(FinanceAccountEntity, oldAcc);
          }
        }
      }

      // Category update
      if (dto.categoryCode) {
        const category = await manager.findOne(FinanceCategoryEntity, {
          where: { code: dto.categoryCode, storeId },
        });
        txn.categoryCode = dto.categoryCode;
        txn.categoryId = category ? category.id : null;
      }

      txn.amount = String(newAmount);
      if (dto.transactionDate) txn.transactionDate = dto.transactionDate;
      if (dto.accountId !== undefined) txn.accountId = dto.accountId || null;
      if (dto.description !== undefined) txn.description = dto.description || null;
      if (dto.reference !== undefined) txn.reference = dto.reference || null;
      if (dto.paymentMethod !== undefined) txn.paymentMethod = dto.paymentMethod || null;

      return manager.save(FinanceTransactionEntity, txn);
    });
  }
}
