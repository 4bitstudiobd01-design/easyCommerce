import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { RecordInvoicePaymentDto } from '../dto/invoice.dto';
import { CreateTransactionService } from './create-transaction.service';
import {
  FinanceInvoiceStatusEnum,
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';

@Injectable()
export class RecordInvoicePaymentService {
  constructor(
    @InjectRepository(FinanceInvoiceEntity)
    private readonly invoiceRepository: Repository<FinanceInvoiceEntity>,
    private readonly createTransactionService: CreateTransactionService,
  ) {}

  async execute(
    storeId: string,
    invoiceId: string,
    userId: string,
    dto: RecordInvoicePaymentDto,
  ): Promise<FinanceInvoiceEntity> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, storeId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0.');
    }

    const currentBalanceDue = Number(invoice.balanceDue || 0);
    if (dto.amount > currentBalanceDue) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds current balance due (${currentBalanceDue}).`,
      );
    }

    const newPaidAmount = Number(invoice.paidAmount || 0) + dto.amount;
    const newBalanceDue = Math.max(0, currentBalanceDue - dto.amount);

    invoice.paidAmount = String(newPaidAmount);
    invoice.balanceDue = String(newBalanceDue);
    const today = new Date().toISOString().split('T')[0];
    invoice.status =
      newBalanceDue === 0
        ? FinanceInvoiceStatusEnum.PAID
        : invoice.dueDate < today
        ? FinanceInvoiceStatusEnum.OVERDUE
        : FinanceInvoiceStatusEnum.PARTIALLY_PAID;

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Record incoming finance transaction
    await this.createTransactionService.execute(invoice.tenantId, storeId, userId, {
      type: FinanceTransactionTypeEnum.INCOME,
      amount: dto.amount,
      currency: invoice.currency,
      transactionDate: dto.paymentDate,
      accountId: dto.accountId,
      categoryCode: 'PRODUCT_SALES',
      description: `Payment for Invoice #${invoice.invoiceNumber}${dto.notes ? ' - ' + dto.notes : ''}`,
      reference: dto.reference || invoice.invoiceNumber,
      paymentMethod: dto.paymentMethod,
      sourceType: FinanceSourceTypeEnum.INVOICE,
      sourceId: invoice.id,
      status: FinanceTransactionStatusEnum.COMPLETED,
    });

    return updatedInvoice;
  }
}
