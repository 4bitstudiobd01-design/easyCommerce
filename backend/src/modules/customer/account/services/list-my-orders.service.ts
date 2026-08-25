import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrderEntity } from '../../../order/entities/order.entity';
import { CustomerOrderListDto } from '../../dto/customer-order-list.dto';

export interface MyOrderListItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  grandTotal: number;
  subtotal: number;
  deliveryFee: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  itemsCount: number;
  courierProvider?: string;
  consignmentStatus?: string;
  trackingCode?: string;
}

/**
 * Customer-facing "my orders" list. Unlike ListCustomerOrdersService (the
 * merchant-side equivalent), this never accepts a customerId from the
 * request — only from the authenticated JWT — and deliberately has no
 * customerPhone fallback: guest orders already carry the customer's real
 * CustomerEntity.id in order.customerId by the time they can log in (see
 * register-customer.service.ts's (tenantId, phone) upgrade match), so an
 * OR-by-phone fallback here would only be a phone-spoofing surface.
 */
@Injectable()
export class ListMyOrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(customerId: string, tenantId: string, storeSlug: string, dto: CustomerOrderListDto) {
    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(50, Math.max(1, dto.limit || 10));
    const skip = (page - 1) * limit;

    const query = this.orderRepository.createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.storeSlug = :storeSlug', { storeSlug })
      .andWhere('o.customerId = :customerId', { customerId });

    if (dto.status) {
      query.andWhere('o.orderStatus = :status', { status: dto.status });
    }

    if (dto.search && dto.search.trim() !== '') {
      const s = `%${dto.search.trim()}%`;
      query.andWhere('o.orderNumber ILIKE :s', { s });
    }

    query.orderBy('o.createdAt', 'DESC').addOrderBy('o.id', 'ASC');
    query.skip(skip).take(limit);

    const [orders, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 0;

    if (orders.length === 0) {
      return { data: [], meta: { page, limit, total, totalPages } };
    }

    const orderIds = orders.map((o) => o.id);
    const itemCountsRaw = await this.dataSource.query(
      `
      SELECT "orderId", COUNT(id)::int AS "itemsCount"
      FROM order_items
      WHERE "orderId" = ANY($1)
      GROUP BY "orderId"
      `,
      [orderIds],
    );

    const itemCountsMap = new Map<string, number>();
    for (const row of itemCountsRaw) {
      itemCountsMap.set(row.orderId, Number(row.itemsCount || 0));
    }

    const consignmentsRaw = await this.dataSource.query(
      `
      SELECT DISTINCT ON ("orderId") "orderId", "courierProvider", "status", "trackingCode"
      FROM consignments
      WHERE "orderId" = ANY($1)
      ORDER BY "orderId", "createdAt" DESC
      `,
      [orderIds],
    );

    const consignmentMap = new Map<string, { courierProvider: string; status: string; trackingCode: string | null }>();
    for (const row of consignmentsRaw) {
      consignmentMap.set(row.orderId, row);
    }

    const items: MyOrderListItem[] = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: new Date(o.createdAt).toISOString(),
      grandTotal: Number(o.grandTotal || 0),
      subtotal: Number(o.subtotal || 0),
      deliveryFee: Number(o.deliveryFee || 0),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      itemsCount: itemCountsMap.get(o.id) || 0,
      courierProvider: consignmentMap.get(o.id)?.courierProvider,
      consignmentStatus: consignmentMap.get(o.id)?.status,
      trackingCode: consignmentMap.get(o.id)?.trackingCode ?? undefined,
    }));

    return { data: items, meta: { page, limit, total, totalPages } };
  }
}
