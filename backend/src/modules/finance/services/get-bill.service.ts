import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceBillStatusEnum, FinanceSourceTypeEnum } from '../enums/finance.enums';

@Injectable()
export class GetBillService {
  constructor(
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
  ) {}

  async execute(storeId: string, billId: string): Promise<any> {
    const bill = await this.billRepository.findOne({
      where: { id: billId, storeId },
      relations: ['items'],
    });

    if (!bill) {
      throw new NotFoundException('Bill not found.');
    }

    const today = new Date().toISOString().split('T')[0];
    const bal = Number(bill.balanceDue || 0);
    if (
      bill.status !== FinanceBillStatusEnum.PAID &&
      bill.status !== FinanceBillStatusEnum.VOID &&
      bill.dueDate < today &&
      bal > 0
    ) {
      bill.status = FinanceBillStatusEnum.OVERDUE;
    }

    // Fetch linked payment transactions
    const payments = await this.transactionRepository.find({
      where: {
        storeId,
        sourceType: FinanceSourceTypeEnum.BILL,
        sourceId: billId,
      },
      relations: ['account'],
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
    });

    return {
      ...bill,
      payments,
    };
  }
}
