import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceBillEntity } from '../entities/finance-bill.entity';

@Injectable()
export class GetBillService {
  constructor(
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
  ) {}

  async execute(storeId: string, billId: string): Promise<FinanceBillEntity> {
    const bill = await this.billRepository.findOne({
      where: { id: billId, storeId },
      relations: ['items'],
    });

    if (!bill) {
      throw new NotFoundException('Bill not found.');
    }

    return bill;
  }
}
