import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { FinanceInvoiceStatusEnum } from '../enums/finance.enums';

@Injectable()
export class UpdateInvoiceStatusService {
  constructor(
    @InjectRepository(FinanceInvoiceEntity)
    private readonly invoiceRepository: Repository<FinanceInvoiceEntity>,
  ) {}

  async execute(
    storeId: string,
    invoiceId: string,
    status: FinanceInvoiceStatusEnum,
  ): Promise<FinanceInvoiceEntity> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, storeId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }

    invoice.status = status;
    return this.invoiceRepository.save(invoice);
  }
}
