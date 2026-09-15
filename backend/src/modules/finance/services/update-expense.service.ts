import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceCategoryEntity } from '../entities/finance-category.entity';
import { UserEntity, UserRoleEnum } from '../../user/entities/user.entity';
import { UpdateExpenseDto } from '../dto/transaction.dto';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
} from '../enums/finance.enums';

@Injectable()
export class UpdateExpenseService {
  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceCategoryEntity)
    private readonly categoryRepository: Repository<FinanceCategoryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    storeId: string,
    id: string,
    userId: string,
    dto: UpdateExpenseDto,
  ): Promise<FinanceTransactionEntity> {
    const txn = await this.transactionRepository.findOne({
      where: { id, storeId, type: FinanceTransactionTypeEnum.EXPENSE },
      relations: ['account', 'category', 'receiptFile'],
    });

    if (!txn) {
      throw new NotFoundException('Expense transaction not found.');
    }

    // Check if editing a past month expense - only Admin/Owner allowed
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
          'Only administrators can edit financial expense records from previous months.',
        );
      }
    }

    const oldAmount = Number(txn.amount || 0);
    const newAmount = dto.amount !== undefined ? Number(dto.amount) : oldAmount;
    if (newAmount <= 0) {
      throw new BadRequestException('Expense amount must be greater than 0.');
    }

    const oldAccountId = txn.accountId;
    const newAccountId = dto.accountId !== undefined ? dto.accountId : oldAccountId;

    // Handle account balance adjustments if transaction was completed
    if (txn.status === FinanceTransactionStatusEnum.COMPLETED) {
      if (oldAccountId && oldAccountId !== newAccountId) {
        // Revert deduction on old account
        const oldAcc = await this.accountRepository.findOne({ where: { id: oldAccountId, storeId } });
        if (oldAcc) {
          oldAcc.currentBalance = String(Number(oldAcc.currentBalance || 0) + oldAmount);
          await this.accountRepository.save(oldAcc);
        }
        // Apply deduction on new account
        if (newAccountId) {
          const newAcc = await this.accountRepository.findOne({ where: { id: newAccountId, storeId } });
          if (newAcc) {
            newAcc.currentBalance = String(Number(newAcc.currentBalance || 0) - newAmount);
            await this.accountRepository.save(newAcc);
          }
        }
      } else if (oldAccountId && oldAccountId === newAccountId) {
        // Account didn't change, but amount might have
        const diff = newAmount - oldAmount;
        if (diff !== 0) {
          const acc = await this.accountRepository.findOne({ where: { id: oldAccountId, storeId } });
          if (acc) {
            acc.currentBalance = String(Number(acc.currentBalance || 0) - diff);
            await this.accountRepository.save(acc);
          }
        }
      } else if (!oldAccountId && newAccountId) {
        // Was direct cash, now linked to an account
        const newAcc = await this.accountRepository.findOne({ where: { id: newAccountId, storeId } });
        if (newAcc) {
          newAcc.currentBalance = String(Number(newAcc.currentBalance || 0) - newAmount);
          await this.accountRepository.save(newAcc);
        }
      }
    }

    // Category update
    if (dto.categoryCode) {
      const category = await this.categoryRepository.findOne({
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
    if (dto.receiptFileId !== undefined) txn.receiptFileId = dto.receiptFileId || null;

    return this.transactionRepository.save(txn);
  }
}
