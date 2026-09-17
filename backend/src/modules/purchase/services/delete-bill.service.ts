import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillEntity } from '../entities/bill.entity';
import { SupplierPaymentEntity } from '../entities/supplier-payment.entity';

/**
 * Hard-deletes a bill (its lines cascade). Blocked once the bill has supplier payments or a
 * posted Accounts Payable journal entry — those must be reversed in Accounting first.
 */
@Injectable()
export class DeleteBillService {
  constructor(
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
    @InjectRepository(SupplierPaymentEntity)
    private readonly paymentRepository: Repository<SupplierPaymentEntity>,
  ) {}

  async execute(
    storeId: string,
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const bill = await this.billRepository.findOne({ where: { id, storeId } });
    if (!bill) {
      throw new NotFoundException('Bill not found in this store.');
    }

    const paymentCount = await this.paymentRepository.count({
      where: { storeId, billId: id },
    });
    if (paymentCount > 0) {
      throw new BadRequestException(
        'Remove the supplier payments on this bill before deleting it.',
      );
    }
    if (bill.journalEntryId) {
      throw new BadRequestException(
        'This bill has been posted to the ledger and cannot be deleted. Reverse the journal entry in Accounting first.',
      );
    }

    await this.billRepository.remove(bill);
    return { success: true, message: 'Bill deleted.' };
  }
}
