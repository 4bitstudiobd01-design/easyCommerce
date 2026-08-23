import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Brackets } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { ConsignmentEntity } from '../../logistics/entities/consignment.entity';
import { OrderListDto, PaginatedOrderResponse } from '../dto/order-list.dto';

@Injectable()
export class ListMerchantOrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
  ) {}

  async execute(tenantId: string, dto: OrderListDto): Promise<PaginatedOrderResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      paymentStatus,
      courier,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = dto;

    const query = this.orderRepository.createQueryBuilder('order');

    // Tenant Isolation
    query.where('order.tenantId = :tenantId', { tenantId });
    // Rows from this query also back the invoice and thermal-label modals, which print
    // per-item pricing — so those columns must be selected here, not just the quantity
    // the table itself displays. Still narrowed to the printed fields rather than
    // selecting whole item rows.
    query
      .leftJoin('order.items', 'items')
      .addSelect([
        'items.id',
        'items.quantity',
        'items.productTitle',
        'items.sku',
        'items.unitPrice',
        'items.totalPrice',
      ]);

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('order.orderNumber ILIKE :search', { search: `%${search}%` })
            .orWhere('order.customerName ILIKE :search', { search: `%${search}%` })
            .orWhere('order.customerPhone ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (status) {
      query.andWhere('order.orderStatus = :status', { status });
    }

    if (paymentStatus) {
      query.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    }

    if (courier && courier !== 'ALL') {
      // Consignments belong to the logistics module, so this stays a scoped subquery
      // rather than an ORM relation join across the module boundary.
      query.andWhere(
        `EXISTS (
          SELECT 1 FROM consignments c
          WHERE c."orderId" = order.id
            AND c."tenantId" = :tenantId
            AND c."courierProvider" = :courier
        )`,
        { courier },
      );
    }

    if (dateFrom) {
      query.andWhere('order.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      query.andWhere('order.createdAt <= :dateTo', { dateTo });
    }

    // Sort mapping to prevent injection
    const allowedSortFields = ['createdAt', 'grandTotal', 'orderNumber'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    query.orderBy(`order.${sortField}`, sortDir);

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    // Consignments live in the logistics module, so this is a second batched query
    // (not a join) keyed on the current page's order ids — one query regardless of
    // page size, not N+1 per row.
    if (data.length > 0) {
      const consignments = await this.consignmentRepository.find({
        where: { orderId: In(data.map((order) => order.id)), tenantId },
      });
      const consignmentByOrderId = new Map(consignments.map((c) => [c.orderId, c]));
      for (const order of data) {
        order.consignment = consignmentByOrderId.get(order.id);
      }
    }

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
