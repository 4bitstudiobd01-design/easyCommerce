import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionService } from './create-transaction.service';
import { CreateExpenseDto } from '../dto/transaction.dto';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';

@Injectable()
export class CreateExpenseService {
  constructor(private readonly createTransactionService: CreateTransactionService) {}

  async execute(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<FinanceTransactionEntity> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Expense amount must be greater than 0.');
    }

    return this.createTransactionService.execute(tenantId, storeId, userId, {
      type: FinanceTransactionTypeEnum.EXPENSE,
      amount: dto.amount,
      transactionDate: dto.transactionDate,
      accountId: dto.accountId,
      categoryCode: dto.categoryCode,
      description: dto.description,
      reference: dto.reference,
      paymentMethod: dto.paymentMethod,
      receiptFileId: dto.receiptFileId,
      sourceType: FinanceSourceTypeEnum.MANUAL,
      status: FinanceTransactionStatusEnum.COMPLETED,
    });
  }
}
