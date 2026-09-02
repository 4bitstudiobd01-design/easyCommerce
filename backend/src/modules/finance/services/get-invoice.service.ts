import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceInvoiceStatusEnum, FinanceSourceTypeEnum } from '../enums/finance.enums';

@Injectable()
export class GetInvoiceService {
  constructor(
    @InjectRepository(FinanceInvoiceEntity)
    private readonly invoiceRepository: Repository<FinanceInvoiceEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
  ) {}

  async execute(storeId: string, invoiceId: string): Promise<any> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, storeId },
      relations: ['items'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }

    const today = new Date().toISOString().split('T')[0];
    const bal = Number(invoice.balanceDue || 0);
    if (
      invoice.status !== FinanceInvoiceStatusEnum.PAID &&
      invoice.status !== FinanceInvoiceStatusEnum.VOID &&
      invoice.dueDate < today &&
      bal > 0
    ) {
      invoice.status = FinanceInvoiceStatusEnum.OVERDUE;
    }

    // Fetch linked payment transactions
    const payments = await this.transactionRepository.find({
      where: {
        storeId,
        sourceType: FinanceSourceTypeEnum.INVOICE,
        sourceId: invoiceId,
      },
      relations: ['account'],
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
    });

    return {
      ...invoice,
      payments,
    };
  }
}
