import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransferEntity } from '../entities/finance-transfer.entity';

@Injectable()
export class ListTransfersService {
  constructor(
    @InjectRepository(FinanceTransferEntity)
    private readonly transferRepository: Repository<FinanceTransferEntity>,
  ) {}

  async execute(storeId: string) {
    const transfers = await this.transferRepository.find({
      where: { storeId },
      relations: ['fromAccount', 'toAccount'],
      order: { transferDate: 'DESC', createdAt: 'DESC' },
    });

    const totalTransferred = transfers.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0,
    );

    return {
      items: transfers,
      totalTransferred,
    };
  }
}
