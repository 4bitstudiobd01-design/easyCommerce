import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionService } from './create-transaction.service';
import { CreateIncomeDto } from '../dto/transaction.dto';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';

@Injectable()
export class CreateIncomeService {
  constructor(private readonly createTransactionService: CreateTransactionService) {}

  async execute(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: CreateIncomeDto,
  ): Promise<FinanceTransactionEntity> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Income amount must be greater than 0.');
    }

    return this.createTransactionService.execute(tenantId, storeId, userId, {
      type: FinanceTransactionTypeEnum.INCOME,
      amount: dto.amount,
      transactionDate: dto.transactionDate,
      accountId: dto.accountId,
      categoryCode: dto.categoryCode,
      description: dto.description,
      reference: dto.reference,
      paymentMethod: dto.paymentMethod,
      sourceType: FinanceSourceTypeEnum.MANUAL,
      status: FinanceTransactionStatusEnum.COMPLETED,
    });
  }
}
