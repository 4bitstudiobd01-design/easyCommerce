import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { CustomerOrderListDto } from '../dto/customer-order-list.dto';

export interface CustomerOrderListItem {
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
  customerName: string;
  customerPhone: string;
}

@Injectable()
export class ListCustomerOrdersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(customerId: string, tenantId: string, dto: CustomerOrderListDto) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }

    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(50, Math.max(1, dto.limit || 10));
    const skip = (page - 1) * limit;

    const query = this.orderRepository.createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('(o.customerId = :customerId OR o.customerPhone = :phone)', {
        customerId: customer.id,
        phone: customer.phone,
      });

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
      return {
        data: [],
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    }

    // Fetch order item counts in a single aggregated query for retrieved page orders
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

    const items: CustomerOrderListItem[] = orders.map((o) => ({
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
      customerName: o.customerName,
      customerPhone: o.customerPhone,
    }));

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
