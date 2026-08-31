import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import { FinanceBillStatusEnum } from '../enums/finance.enums';

@Injectable()
export class UpdateBillStatusService {
  constructor(
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
  ) {}

  async execute(
    storeId: string,
    billId: string,
    status: FinanceBillStatusEnum,
  ): Promise<FinanceBillEntity> {
    const bill = await this.billRepository.findOne({
      where: { id: billId, storeId },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found.');
    }

    bill.status = status;
    return this.billRepository.save(bill);
  }
}
