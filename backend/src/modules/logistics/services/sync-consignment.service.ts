import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsignmentEntity, CourierProviderEnum } from '../entities/consignment.entity';
import { ConsignmentEventEntity } from '../entities/consignment-event.entity';
import { OrderEntity, OrderStatusEnum } from '../../order/entities/order.entity';
import { OrderStatusHistoryEntity } from '../../order/entities/order-status-history.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { SteadfastCourierAdapter } from '../adapters/steadfast.adapter';
import { PathaoCourierAdapter } from '../adapters/pathao.adapter';

@Injectable()
export class SyncConsignmentService {
  constructor(
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    @InjectRepository(ConsignmentEventEntity)
    private readonly consignmentEventRepository: Repository<ConsignmentEventEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly orderStatusHistoryRepository: Repository<OrderStatusHistoryEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    private readonly steadfastAdapter: SteadfastCourierAdapter,
    private readonly pathaoAdapter: PathaoCourierAdapter,
  ) {}

  async execute(orderId: string, tenantId: string, userId: string): Promise<ConsignmentEntity> {
    const consignment = await this.consignmentRepository.findOne({
      where: { orderId, tenantId },
    });

    if (!consignment) {
      throw new NotFoundException(`Consignment for order "${orderId}" not found.`);
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException(`Order not found.`);
    }

    const store = await this.storeRepository.findOne({ where: { tenantId } });

    let trackingResult;
    if (consignment.courierProvider === CourierProviderEnum.PATHAO) {
      trackingResult = await this.pathaoAdapter.trackParcel(consignment.trackingCode, {
        clientId: store?.pathaoClientId,
        clientSecret: store?.pathaoClientSecret,
      });
    } else {
      trackingResult = await this.steadfastAdapter.trackParcel(consignment.trackingCode, {
        apiKey: store?.steadfastApiKey,
        secretKey: store?.steadfastSecretKey,
      });
    }

    // Process tracking events safely (avoid duplicates based on status + timestamp)
    for (const event of trackingResult.events) {
      const exists = await this.consignmentEventRepository.findOne({
        where: {
          consignmentId: consignment.id,
          status: event.status,
          eventTimestamp: event.timestamp,
        },
      });

      if (!exists) {
        const newEvent = this.consignmentEventRepository.create({
          consignmentId: consignment.id,
          status: event.status,
          eventTimestamp: event.timestamp,
          location: event.location,
          description: event.description,
        });
        await this.consignmentEventRepository.save(newEvent);
      }
    }

    // Detect state changes
    const previousStatus = consignment.status;
    consignment.status = trackingResult.currentStatus;
    consignment.lastSyncAt = new Date();
    await this.consignmentRepository.save(consignment);

    // Sync domain logic if status changed
    if (previousStatus !== consignment.status) {
      let orderStatusChanged = false;
      let newOrderStatus = order.orderStatus;

      if (consignment.status === 'PICKED_UP' && order.orderStatus === OrderStatusEnum.READY_TO_SHIP) {
        newOrderStatus = OrderStatusEnum.SHIPPED;
        orderStatusChanged = true;
      } else if (consignment.status === 'DELIVERED' && order.orderStatus === OrderStatusEnum.SHIPPED) {
        newOrderStatus = OrderStatusEnum.DELIVERED;
        orderStatusChanged = true;
      } else if (consignment.status === 'RETURNED' && order.orderStatus === OrderStatusEnum.SHIPPED) {
        newOrderStatus = OrderStatusEnum.RETURNED;
        orderStatusChanged = true;
      }

      if (orderStatusChanged) {
        const previousOrderState = order.orderStatus;
        order.orderStatus = newOrderStatus;
        await this.orderRepository.save(order);

        const history = this.orderStatusHistoryRepository.create({
          orderId: order.id,
          previousStatus: previousOrderState,
          newStatus: newOrderStatus,
          changedBy: userId,
          reason: `Synchronized automatically based on courier status: ${consignment.status}`,
          tenantId,
        });
        await this.orderStatusHistoryRepository.save(history);
      }
    }

    return consignment;
  }
}
