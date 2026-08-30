import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import { FinanceBillItemEntity } from '../entities/finance-bill-item.entity';
import { FinanceSettingEntity } from '../entities/finance-setting.entity';
import { CreateFinanceBillDto } from '../dto/bill.dto';
import { FinanceBillStatusEnum } from '../enums/finance.enums';

@Injectable()
export class CreateBillService {
  constructor(
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
    @InjectRepository(FinanceBillItemEntity)
    private readonly billItemRepository: Repository<FinanceBillItemEntity>,
    @InjectRepository(FinanceSettingEntity)
    private readonly settingRepository: Repository<FinanceSettingEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: CreateFinanceBillDto,
  ): Promise<FinanceBillEntity> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('A bill must have at least one line item.');
    }

    // Resolve or generate bill number
    let billNumber = dto.billNumber;
    if (!billNumber) {
      const setting = await this.settingRepository.findOne({ where: { storeId } });
      const prefix = setting?.billPrefix || 'BILL-';
      const count = await this.billRepository.count({ where: { storeId } });
      billNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;
    }

    // Calculate item totals, subtotal, and tax
    let subtotal = 0;
    let taxAmount = 0;

    const items: FinanceBillItemEntity[] = dto.items.map((itemDto) => {
      const qty = itemDto.quantity || 1;
      const price = itemDto.unitPrice || 0;
      const rate = itemDto.taxRate || 0;
      const itemSub = qty * price;
      const itemTax = itemSub * (rate / 100);
      const itemTotal = itemSub + itemTax;

      subtotal += itemSub;
      taxAmount += itemTax;

      return this.billItemRepository.create({
        title: itemDto.title,
        description: itemDto.description,
        quantity: qty,
        unitPrice: String(price),
        taxRate: String(rate),
        totalAmount: String(itemTotal),
      });
    });

    const totalAmount = subtotal + taxAmount;
    const paidAmount = 0;
    const balanceDue = totalAmount;

    const bill = this.billRepository.create({
      tenantId,
      storeId,
      billNumber,
      supplierName: dto.supplierName,
      supplierContact: dto.supplierContact,
      supplierEmail: dto.supplierEmail,
      category: dto.category || 'OTHER',
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      subtotal: String(subtotal),
      taxAmount: String(taxAmount),
      totalAmount: String(totalAmount),
      paidAmount: String(paidAmount),
      balanceDue: String(balanceDue),
      currency: dto.currency || 'BDT',
      status: dto.status || FinanceBillStatusEnum.UNPAID,
      notes: dto.notes,
      attachmentFileId: dto.attachmentFileId,
      items,
      createdByUserId: userId,
    });

    return this.billRepository.save(bill);
  }
}
