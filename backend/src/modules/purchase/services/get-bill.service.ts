import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillEntity } from '../entities/bill.entity';

/**
 * A single bill with its lines, for the bill detail / payment views.
 */
@Injectable()
export class GetBillService {
  constructor(
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
  ) {}

  async execute(storeId: string, id: string): Promise<BillEntity> {
    const bill = await this.billRepository.findOne({
      where: { id, storeId },
      relations: ['lines'],
    });
    if (!bill) {
      throw new NotFoundException('Bill not found in this store.');
    }
    bill.lines = [...bill.lines].sort((a, b) => a.lineOrder - b.lineOrder);
    return bill;
  }
}
