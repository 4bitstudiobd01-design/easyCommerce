import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import { RecordBillPaymentDto } from '../dto/bill.dto';
import { CreateTransactionService } from './create-transaction.service';
import {
  FinanceBillStatusEnum,
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';

@Injectable()
export class RecordBillPaymentService {
  constructor(
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
    private readonly createTransactionService: CreateTransactionService,
  ) {}

  async execute(
    storeId: string,
    billId: string,
    userId: string,
    dto: RecordBillPaymentDto,
  ): Promise<FinanceBillEntity> {
    const bill = await this.billRepository.findOne({
      where: { id: billId, storeId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found.');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0.');
    }

    const currentBalanceDue = Number(bill.balanceDue || 0);
    if (dto.amount > currentBalanceDue) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds current balance due (${currentBalanceDue}).`,
      );
    }

    const newPaidAmount = Number(bill.paidAmount || 0) + dto.amount;
    const newBalanceDue = Math.max(0, currentBalanceDue - dto.amount);

    bill.paidAmount = String(newPaidAmount);
    bill.balanceDue = String(newBalanceDue);
    const today = new Date().toISOString().split('T')[0];
    bill.status =
      newBalanceDue === 0
        ? FinanceBillStatusEnum.PAID
        : bill.dueDate < today
        ? FinanceBillStatusEnum.OVERDUE
        : FinanceBillStatusEnum.PARTIALLY_PAID;

    const updatedBill = await this.billRepository.save(bill);

    // Record outgoing payment transaction (decreases cash/bank)
    await this.createTransactionService.execute(bill.tenantId, storeId, userId, {
      type: FinanceTransactionTypeEnum.EXPENSE,
      amount: dto.amount,
      currency: bill.currency,
      transactionDate: dto.paymentDate,
      accountId: dto.accountId,
      categoryCode: bill.category || 'OTHER',
      description: `Bill Payment for #${bill.billNumber} to ${bill.supplierName}${dto.notes ? ' - ' + dto.notes : ''}`,
      reference: dto.reference || bill.billNumber,
      paymentMethod: dto.paymentMethod,
      sourceType: FinanceSourceTypeEnum.BILL,
      sourceId: bill.id,
      status: FinanceTransactionStatusEnum.COMPLETED,
    });

    return updatedBill;
  }
}
