import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderEntity } from '../entities/purchase-order.entity';

/**
 * A single purchase order with its lines, for the PO detail / receive views.
 */
@Injectable()
export class GetPurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
  ) {}

  async execute(storeId: string, id: string): Promise<PurchaseOrderEntity> {
    const po = await this.purchaseOrderRepository.findOne({
      where: { id, storeId },
      relations: ['lines'],
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found in this store.');
    }
    po.lines = [...po.lines].sort((a, b) => a.lineOrder - b.lineOrder);
    return po;
  }
}
