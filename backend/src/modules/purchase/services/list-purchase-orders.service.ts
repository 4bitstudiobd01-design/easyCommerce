import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { PurchaseOrderEntity } from '../entities/purchase-order.entity';
import { ListPurchaseOrdersQueryDto } from '../dto/purchase-order.dto';

export interface PurchaseOrderListItem
  extends Omit<PurchaseOrderEntity, 'lines'> {
  /** receivedValue / totalAmount × 100, fixed(2). 0 when the PO has no value. */
  receivedPct: string;
}

export interface PaginatedPurchaseOrders {
  items: PurchaseOrderListItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Paginated, filterable purchase-order list for the Purchase → Purchase Orders page. Lines
 * are not loaded here; the detail endpoint returns them.
 */
@Injectable()
export class ListPurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
  ) {}

  async execute(
    storeId: string,
    query: ListPurchaseOrdersQueryDto,
  ): Promise<PaginatedPurchaseOrders> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

    const qb = this.purchaseOrderRepository
      .createQueryBuilder('po')
      .where('po.storeId = :storeId', { storeId });

    if (query.status) {
      qb.andWhere('po.status = :status', { status: query.status });
    }
    if (query.supplierId) {
      qb.andWhere('po.supplierId = :supplierId', { supplierId: query.supplierId });
    }
    if (query.from) {
      qb.andWhere('po.orderDate >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('po.orderDate <= :to', { to: query.to });
    }
    if (query.search) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('po.poNumber ILIKE :s', { s: `%${query.search}%` }).orWhere(
            'po.supplierName ILIKE :s',
            { s: `%${query.search}%` },
          );
        }),
      );
    }

    const [orders, total] = await qb
      .orderBy('po.orderDate', 'DESC')
      .addOrderBy('po.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const items: PurchaseOrderListItem[] = orders.map((po) => {
      const totalAmount = Number(po.totalAmount);
      const receivedPct =
        totalAmount > 0 ? (Number(po.receivedValue) / totalAmount) * 100 : 0;
      return Object.assign(po, { receivedPct: receivedPct.toFixed(2) });
    });

    return { items, total, page, limit };
  }
}
