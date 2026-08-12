import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { OrderEntity, OrderStatusEnum } from '../entities/order.entity';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';

export interface BulkUpdateStatusDto {
  orderIds?: string[];
  filters?: any;
  selectAllMatching?: boolean;
  targetStatus: OrderStatusEnum;
  reason?: string;
}

export interface BulkUpdateResult {
  total: number;
  successful: number;
  failed: number;
  errors: { orderId: string; orderNumber?: string; reason: string }[];
}

@Injectable()
export class BulkUpdateOrderStatusService {
  private readonly logger = new Logger(BulkUpdateOrderStatusService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly statusHistoryRepository: Repository<OrderStatusHistoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(tenantId: string, storeId: string, dto: BulkUpdateStatusDto, userId: string): Promise<BulkUpdateResult> {
    let targetOrderIds: string[] = [];

    // Determine the target IDs
    if (dto.selectAllMatching && dto.filters) {
      // Build query to fetch all matching IDs based on filters
      const qb = this.orderRepository.createQueryBuilder('order')
        .select('order.id')
        .where('order.tenantId = :tenantId', { tenantId })
        .andWhere('order.storeSlug = :storeId', { storeId }); // Assuming storeSlug represents the store identity here

      if (dto.filters.status && dto.filters.status !== 'ALL') {
        qb.andWhere('order.orderStatus = :status', { status: dto.filters.status });
      }
      if (dto.filters.paymentStatus && dto.filters.paymentStatus !== 'ALL') {
        qb.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: dto.filters.paymentStatus });
      }
      if (dto.filters.search) {
        qb.andWhere(
          '(order.orderNumber ILIKE :search OR order.customerName ILIKE :search OR order.customerPhone ILIKE :search)',
          { search: `%${dto.filters.search}%` },
        );
      }

      const orders = await qb.getMany();
      targetOrderIds = orders.map((o) => o.id);
    } else if (dto.orderIds && dto.orderIds.length > 0) {
      targetOrderIds = dto.orderIds;
    } else {
      throw new BadRequestException('No orders selected for bulk operation.');
    }

    if (targetOrderIds.length === 0) {
      return { total: 0, successful: 0, failed: 0, errors: [] };
    }

    const result: BulkUpdateResult = {
      total: targetOrderIds.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Process in batches of 50 to avoid locking the entire DB table
    const batchSize = 50;
    for (let i = 0; i < targetOrderIds.length; i += batchSize) {
      const batchIds = targetOrderIds.slice(i, i + batchSize);
      
      const orders = await this.orderRepository.find({
        where: { id: In(batchIds), tenantId, storeSlug: storeId },
      });

      for (const order of orders) {
        try {
          this.validateTransition(order, dto.targetStatus);
          
          await this.dataSource.transaction(async (manager) => {
            const history = new OrderStatusHistoryEntity();
            history.order = order;
            history.previousStatus = order.orderStatus;
            history.newStatus = dto.targetStatus;
            history.reason = dto.reason ? `Bulk Operation: ${dto.reason}` : 'Bulk status update';
            history.changedBy = userId;
            await manager.save(OrderStatusHistoryEntity, history);

            order.orderStatus = dto.targetStatus;
            await manager.save(OrderEntity, order);
          });

          result.successful++;
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            reason: error.message,
          });
        }
      }
    }

    return result;
  }

  private validateTransition(order: OrderEntity, targetStatus: OrderStatusEnum) {
    if (order.orderStatus === targetStatus) {
      throw new Error(`Order is already ${targetStatus}`);
    }

    if (order.orderStatus === OrderStatusEnum.CANCELLED) {
      throw new Error('Cannot modify a cancelled order');
    }

    if (order.orderStatus === OrderStatusEnum.RETURNED) {
      throw new Error('Cannot modify a returned order');
    }

    if (targetStatus === OrderStatusEnum.CANCELLED) {
      if (order.orderStatus === OrderStatusEnum.DELIVERED || order.orderStatus === OrderStatusEnum.SHIPPED) {
        throw new Error('Cannot cancel a shipped or delivered order');
      }
    }

    if (targetStatus === OrderStatusEnum.COMPLETED) {
       if (order.orderStatus !== OrderStatusEnum.DELIVERED) {
         throw new Error('Only delivered orders can be marked as completed');
       }
    }
  }
}
