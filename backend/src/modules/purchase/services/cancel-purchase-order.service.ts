import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PurchaseOrderEntity,
  PurchaseOrderStatusEnum,
} from '../entities/purchase-order.entity';

/**
 * Cancels a purchase order. Blocked once any goods have been received against it.
 */
@Injectable()
export class CancelPurchaseOrderService {
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
    if (po.status === PurchaseOrderStatusEnum.CANCELLED) {
      return po;
    }
    if (
      po.status === PurchaseOrderStatusEnum.PARTIALLY_RECEIVED ||
      po.status === PurchaseOrderStatusEnum.FULLY_RECEIVED
    ) {
      throw new BadRequestException(
        'A purchase order with received items cannot be cancelled.',
      );
    }

    po.status = PurchaseOrderStatusEnum.CANCELLED;
    await this.purchaseOrderRepository.save(po);
    return po;
  }
}
