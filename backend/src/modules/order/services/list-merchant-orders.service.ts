import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { OrderListDto, PaginatedOrderResponse } from '../dto/order-list.dto';

@Injectable()
export class ListMerchantOrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async execute(tenantId: string, dto: OrderListDto): Promise<PaginatedOrderResponse> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      paymentStatus,
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
