import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum } from '../entities/order.entity';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { TriggerOrderStatusSmsService } from '../../sms/services/trigger-order-status-sms.service';
import { ConsignmentEntity } from '../../logistics/entities/consignment.entity';
import { OrderStateService } from './order-state.service';
import { AdjustStockService } from '../../inventory/services/adjust-stock.service';
import { StockAdjustmentAction } from '../../inventory/dto/adjust-stock.dto';

@Injectable()
export class UpdateOrderStatusService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    private readonly triggerOrderStatusSmsService: TriggerOrderStatusSmsService,
    private readonly orderStateService: OrderStateService,
    private readonly adjustStockService: AdjustStockService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(id: string, tenantId: string, userId: string, dto: UpdateOrderStatusDto): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found.`);
    }

    // 1. Enforce business rules
    this.orderStateService.assertTransition(order.orderStatus, dto.orderStatus, dto.reason);

    const previousStatus = order.orderStatus;
    order.orderStatus = dto.orderStatus;

    // Delivery only implies payment for orders that were already paid online —
    // a COD order isn't PAID just because it was delivered; the cash still has
    // to be collected separately via CollectCodService, which sets COD_COLLECTED.
    // Forcing PAID here regardless of method used to silently mark undelivered
    // COD orders as paid with no corresponding payment record behind them.
    if (dto.orderStatus === OrderStatusEnum.DELIVERED && order.paymentStatus === PaymentStatusEnum.UNPAID) {
      order.paymentStatus = PaymentStatusEnum.PAID;
    }

    // 2. Perform Transactional update
    let savedOrder: OrderEntity;
    
    await this.dataSource.transaction(async (manager) => {
      // Create history record
      const history = manager.create(OrderStatusHistoryEntity, {
        orderId: order.id,
        previousStatus,
        newStatus: order.orderStatus,
        changedBy: userId,
        reason: dto.reason,
        tenantId,
      });

      // Save order and history atomicaly
      savedOrder = await manager.save(order);
      await manager.save(history);
    });

    // 3. Handle domain side-effects outside core transaction to interact with loosely coupled modules safely
    // (Inventory)
    if (dto.orderStatus === OrderStatusEnum.CANCELLED) {
      for (const item of order.items) {
        if (item.isCustomItem) {
          continue;
        }
        try {
          await this.adjustStockService.execute(tenantId, {
            productId: item.productId as string,
            quantity: item.quantity,
            action: StockAdjustmentAction.ADD,
          });
        } catch (e) {
          // Log error but do not fail the request; inventory drift should be handled by reconcilliation
          console.error(`Failed to restore stock for cancelled order ${order.orderNumber}, product ${item.productId}`, e);
        }
      }
    }

    // Fetch consignment if shipped
    let consignment: ConsignmentEntity | null = null;
    if (dto.orderStatus === OrderStatusEnum.SHIPPED) {
      consignment = await this.consignmentRepository.findOne({ where: { orderId: order.id } });
    }

    // 4. Trigger SMS
    try {
      await this.triggerOrderStatusSmsService.execute({
        orderNumber: savedOrder!.orderNumber,
        customerPhone: savedOrder!.customerPhone,
        customerName: savedOrder!.customerName,
        storeName: savedOrder!.storeSlug,
        grandTotal: Number(savedOrder!.grandTotal),
        orderStatus: dto.orderStatus,
        tenantId: savedOrder!.tenantId,
        courierProvider: consignment?.courierProvider,
        trackingCode: consignment?.trackingCode,
      });
    } catch (err) {
      // Non-blocking SMS trigger
    }

    return savedOrder!;
  }
}
