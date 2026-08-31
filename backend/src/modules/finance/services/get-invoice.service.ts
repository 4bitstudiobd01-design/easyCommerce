import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';

@Injectable()
export class GetInvoiceService {
  constructor(
    @InjectRepository(FinanceInvoiceEntity)
    private readonly invoiceRepository: Repository<FinanceInvoiceEntity>,
  ) {}

  async execute(storeId: string, invoiceId: string): Promise<FinanceInvoiceEntity> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, storeId },
      relations: ['items'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }

    return invoice;
  }
}
