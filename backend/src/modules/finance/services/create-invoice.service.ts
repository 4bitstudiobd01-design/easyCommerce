import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { FinanceInvoiceItemEntity } from '../entities/finance-invoice-item.entity';
import { FinanceSettingEntity } from '../entities/finance-setting.entity';
import { CreateFinanceInvoiceDto } from '../dto/invoice.dto';
import { FinanceInvoiceStatusEnum } from '../enums/finance.enums';

@Injectable()
export class CreateInvoiceService {
  constructor(
    @InjectRepository(FinanceInvoiceEntity)
    private readonly invoiceRepository: Repository<FinanceInvoiceEntity>,
    @InjectRepository(FinanceInvoiceItemEntity)
    private readonly invoiceItemRepository: Repository<FinanceInvoiceItemEntity>,
    @InjectRepository(FinanceSettingEntity)
    private readonly settingRepository: Repository<FinanceSettingEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: CreateFinanceInvoiceDto,
  ): Promise<FinanceInvoiceEntity> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('An invoice must have at least one line item.');
    }

    // Resolve or generate invoice number
    let invoiceNumber = dto.invoiceNumber;
    if (!invoiceNumber) {
      const setting = await this.settingRepository.findOne({ where: { storeId } });
      const prefix = setting?.invoicePrefix || 'INV-';
      const count = await this.invoiceRepository.count({ where: { storeId } });
      invoiceNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
    }

    // Calculate item totals, subtotal, and tax
    let subtotal = 0;
    let taxAmount = 0;

    const items: FinanceInvoiceItemEntity[] = dto.items.map((itemDto) => {
      const qty = itemDto.quantity || 1;
      const price = itemDto.unitPrice || 0;
      const rate = itemDto.taxRate || 0;
      const itemSub = qty * price;
      const itemTax = itemSub * (rate / 100);
      const itemTotal = itemSub + itemTax;

      subtotal += itemSub;
      taxAmount += itemTax;

      return this.invoiceItemRepository.create({
        title: itemDto.title,
        description: itemDto.description,
        quantity: qty,
        unitPrice: String(price),
        taxRate: String(rate),
        totalAmount: String(itemTotal),
        productId: itemDto.productId,
      });
    });

    const discountAmount = dto.discountAmount || 0;
    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);
    const paidAmount = 0;
    const balanceDue = totalAmount;

    const invoice = this.invoiceRepository.create({
      tenantId,
      storeId,
      invoiceNumber,
      customerId: dto.customerId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      customerAddress: dto.customerAddress,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      subtotal: String(subtotal),
      taxAmount: String(taxAmount),
      discountAmount: String(discountAmount),
      totalAmount: String(totalAmount),
      paidAmount: String(paidAmount),
      balanceDue: String(balanceDue),
      currency: dto.currency || 'BDT',
      status: dto.status || FinanceInvoiceStatusEnum.PENDING,
      notes: dto.notes,
      terms: dto.terms,
      items,
      createdByUserId: userId,
    });

    return this.invoiceRepository.save(invoice);
  }
}
