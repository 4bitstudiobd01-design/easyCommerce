import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum } from '../entities/order.entity';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';
import { OrderStateService } from './order-state.service';
import { AdjustStockService } from '../../inventory/services/adjust-stock.service';
import { StockAdjustmentAction } from '../../inventory/dto/adjust-stock.dto';

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
    private readonly orderStateService: OrderStateService,
    private readonly adjustStockService: AdjustStockService,
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
        relations: ['items'],
      });

      const foundIds = new Set(orders.map((o) => o.id));
      for (const missingId of batchIds) {
        if (!foundIds.has(missingId)) {
          result.failed++;
          result.errors.push({ orderId: missingId, reason: 'Order not found for this store.' });
        }
      }

      const ordersToUpdate: OrderEntity[] = [];
      for (const order of orders) {
        try {
          // Reuses the same reason-required check as the single-order update path —
          // a bulk backward move (or bulk cancellation) still needs a reason, since
          // there's no per-order confirmation step in the bulk flow to catch it later.
          this.orderStateService.assertTransition(order.orderStatus, dto.targetStatus, dto.reason);
        } catch (err) {
          result.failed++;
          result.errors.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            reason: err instanceof Error ? err.message : `Invalid order status transition from ${order.orderStatus} to ${dto.targetStatus}`,
          });
          continue;
        }
        ordersToUpdate.push(order);
      }

      if (ordersToUpdate.length === 0) {
        continue;
      }

      const previousStatusByOrderId = new Map(ordersToUpdate.map((o) => [o.id, o.orderStatus]));

      try {
        await this.dataSource.transaction(async (manager) => {
          // Delivery only implies payment for orders that were already paid online —
          // a COD order isn't PAID just because it was delivered; the cash still has
          // to be collected separately via CollectCodService. Forcing PAID here
          // regardless of method would silently mark undelivered COD orders as paid
          // with no corresponding payment record behind them.
          if (dto.targetStatus === OrderStatusEnum.DELIVERED) {
            const unpaidIds = ordersToUpdate
              .filter((o) => o.paymentStatus === PaymentStatusEnum.UNPAID)
              .map((o) => o.id);
            const otherIds = ordersToUpdate
              .filter((o) => o.paymentStatus !== PaymentStatusEnum.UNPAID)
              .map((o) => o.id);

            if (unpaidIds.length > 0) {
              await manager.update(
                OrderEntity,
                { id: In(unpaidIds) },
                { orderStatus: dto.targetStatus, paymentStatus: PaymentStatusEnum.PAID },
              );
            }
            if (otherIds.length > 0) {
              await manager.update(OrderEntity, { id: In(otherIds) }, { orderStatus: dto.targetStatus });
            }
          } else {
            await manager.update(
              OrderEntity,
              { id: In(ordersToUpdate.map((o) => o.id)) },
              { orderStatus: dto.targetStatus },
            );
          }

          const histories = ordersToUpdate.map((order) =>
            manager.create(OrderStatusHistoryEntity, {
              orderId: order.id,
              previousStatus: previousStatusByOrderId.get(order.id),
              newStatus: dto.targetStatus,
              changedBy: userId,
              reason: dto.reason ? `Bulk Operation: ${dto.reason}` : 'Bulk status update',
              tenantId,
            }),
          );
          await manager.insert(OrderStatusHistoryEntity, histories);
        });

        result.successful += ordersToUpdate.length;
      } catch (error: any) {
        result.failed += ordersToUpdate.length;
        for (const order of ordersToUpdate) {
          result.errors.push({ orderId: order.id, orderNumber: order.orderNumber, reason: error.message });
        }
        continue;
      }

      // Restore stock for orders newly cancelled via bulk action (outside the core transaction,
      // consistent with the single-order update path — inventory drift is reconciled separately).
      if (dto.targetStatus === OrderStatusEnum.CANCELLED) {
        for (const order of ordersToUpdate) {
          for (const item of order.items) {
            try {
              await this.adjustStockService.execute(tenantId, {
                productId: item.productId,
                quantity: item.quantity,
                action: StockAdjustmentAction.ADD,
                reason: `Bulk order cancellation restock (${order.orderNumber})`,
              });

            } catch (e) {
              this.logger.error(
                `Failed to restore stock for bulk-cancelled order ${order.orderNumber}, product ${item.productId}`,
                e as Error,
              );
            }
          }
        }
      }
    }

    return result;
  }
}
