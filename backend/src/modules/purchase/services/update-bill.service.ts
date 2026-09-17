import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillEntity } from '../entities/bill.entity';
import { UpdateBillDto } from '../dto/bill.dto';

/**
 * Edits bill metadata only — the vendor invoice number, due date and notes. Line items and
 * amounts are fixed once the bill exists; to re-cost, delete an unposted bill and enter a
 * new one.
 */
@Injectable()
export class UpdateBillService {
  constructor(
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
  ) {}

  async execute(storeId: string, id: string, dto: UpdateBillDto): Promise<BillEntity> {
    const bill = await this.billRepository.findOne({
      where: { id, storeId },
      relations: ['lines'],
    });
    if (!bill) {
      throw new NotFoundException('Bill not found in this store.');
    }

    if (dto.supplierInvoiceNo !== undefined) {
      bill.supplierInvoiceNo = dto.supplierInvoiceNo.trim();
    }
    if (dto.dueDate !== undefined) bill.dueDate = dto.dueDate;
    if (dto.notes !== undefined) bill.notes = dto.notes.trim();

    await this.billRepository.save(bill);
    return bill;
  }
}
