import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceBillEntity } from '../entities/finance-bill.entity';

@Injectable()
export class DeleteBillService {
  constructor(
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
  ) {}

  async execute(storeId: string, billId: string): Promise<void> {
    const bill = await this.billRepository.findOne({
      where: { id: billId, storeId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found.');
    }

    await this.billRepository.remove(bill);
  }
}
