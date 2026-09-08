import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PurchaseOrderEntity,
  PurchaseOrderStatusEnum,
} from '../entities/purchase-order.entity';

export interface PurchaseOrderStatBucket {
  count: number;
  amount: string;
}

export interface PurchaseOrderStats {
  draft: PurchaseOrderStatBucket;
  pendingApproval: PurchaseOrderStatBucket;
  approved: PurchaseOrderStatBucket;
  sent: PurchaseOrderStatBucket;
  partiallyReceived: PurchaseOrderStatBucket;
  fullyReceived: PurchaseOrderStatBucket;
  /** All non-cancelled POs. */
  total: PurchaseOrderStatBucket;
}

const EMPTY: PurchaseOrderStatBucket = { count: 0, amount: '0.00' };

/**
 * Per-status count + amount for the Purchase Orders page KPI cards. CANCELLED POs are
 * excluded from the `total` bucket.
 */
@Injectable()
export class GetPurchaseOrderStatsService {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
  ) {}

  async execute(storeId: string): Promise<PurchaseOrderStats> {
    const rows = await this.purchaseOrderRepository
      .createQueryBuilder('po')
      .select('po.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(po.totalAmount), 0)', 'amount')
      .where('po.storeId = :storeId', { storeId })
      .groupBy('po.status')
      .getRawMany<{ status: PurchaseOrderStatusEnum; count: string; amount: string }>();

    const byStatus = new Map<PurchaseOrderStatusEnum, PurchaseOrderStatBucket>();
    let totalCount = 0;
    let totalAmount = 0;
    for (const row of rows) {
      const bucket = { count: Number(row.count), amount: Number(row.amount).toFixed(2) };
      byStatus.set(row.status, bucket);
      if (row.status !== PurchaseOrderStatusEnum.CANCELLED) {
        totalCount += bucket.count;
        totalAmount += Number(row.amount);
      }
    }

    return {
      draft: byStatus.get(PurchaseOrderStatusEnum.DRAFT) ?? { ...EMPTY },
      pendingApproval:
        byStatus.get(PurchaseOrderStatusEnum.PENDING_APPROVAL) ?? { ...EMPTY },
      approved: byStatus.get(PurchaseOrderStatusEnum.APPROVED) ?? { ...EMPTY },
      sent: byStatus.get(PurchaseOrderStatusEnum.SENT) ?? { ...EMPTY },
      partiallyReceived:
        byStatus.get(PurchaseOrderStatusEnum.PARTIALLY_RECEIVED) ?? { ...EMPTY },
      fullyReceived:
        byStatus.get(PurchaseOrderStatusEnum.FULLY_RECEIVED) ?? { ...EMPTY },
      total: { count: totalCount, amount: totalAmount.toFixed(2) },
    };
  }
}
