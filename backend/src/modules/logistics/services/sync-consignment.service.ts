import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  CodStatusEnum,
  ConsignmentEntity,
  ConsignmentStatusEnum,
} from '../entities/consignment.entity';
import { ConsignmentEventEntity } from '../entities/consignment-event.entity';
import { OrderEntity, OrderStatusEnum } from '../../order/entities/order.entity';
import { OrderStatusHistoryEntity } from '../../order/entities/order-status-history.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { ShipmentDomainService } from './shipment-domain.service';
import { GetShipmentDetailsService } from './get-shipment-details.service';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { RecordCourierApiCallService } from './record-courier-api-call.service';
import { ShipmentDetailsResponseDto } from '../dto/shipment-details-response.dto';

/** Order state implied by a shipment reaching a given status. */
const ORDER_STATUS_BY_SHIPMENT_STATUS: Partial<Record<ConsignmentStatusEnum, OrderStatusEnum>> = {
  [ConsignmentStatusEnum.PICKED_UP]: OrderStatusEnum.SHIPPED,
  [ConsignmentStatusEnum.IN_TRANSIT]: OrderStatusEnum.SHIPPED,
  [ConsignmentStatusEnum.OUT_FOR_DELIVERY]: OrderStatusEnum.SHIPPED,
  [ConsignmentStatusEnum.DELIVERED]: OrderStatusEnum.DELIVERED,
  [ConsignmentStatusEnum.RETURNED]: OrderStatusEnum.RETURNED,
};

@Injectable()
export class SyncConsignmentService {
  private readonly logger = new Logger(SyncConsignmentService.name);

  constructor(
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    @InjectRepository(ConsignmentEventEntity)
    private readonly consignmentEventRepository: Repository<ConsignmentEventEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    private readonly courierProviderRegistry: CourierProviderRegistry,
    private readonly shipmentDomainService: ShipmentDomainService,
    private readonly getShipmentDetailsService: GetShipmentDetailsService,
    private readonly resolveCourierCredentialsService: ResolveCourierCredentialsService,
    private readonly recordCourierApiCallService: RecordCourierApiCallService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Resolves the active shipment attached to an order, for the Orders screen
   * which knows the order but not the shipment. Cancelled parcels are skipped
   * so a replacement shipment is the one that gets synced.
   */
  async resolveShipmentIdByOrder(orderId: string, tenantId: string): Promise<string> {
    const consignment = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .where('consignment."tenantId" = :tenantId', { tenantId })
      .andWhere('consignment."orderId" = :orderId', { orderId })
      .andWhere('consignment.status != :cancelled', {
        cancelled: ConsignmentStatusEnum.CANCELLED,
      })
      .orderBy('consignment."createdAt"', 'DESC')
      .getOne();

    if (!consignment) {
      throw new NotFoundException('No shipment exists for this order.');
    }
    return consignment.id;
  }

  /**
   * Pulls the latest courier state for one shipment and, when the courier
   * reports a legal forward move, advances the shipment, its COD state and the
   * order together.
   */
  async execute(
    shipmentId: string,
    tenantId: string,
    userId: string,
  ): Promise<ShipmentDetailsResponseDto> {
    const consignment = await this.consignmentRepository.findOne({
      where: { id: shipmentId, tenantId },
    });

    if (!consignment) {
      throw new NotFoundException('Shipment not found.');
    }

    if (!consignment.trackingCode) {
      throw new BadRequestException(
        'This shipment has no tracking code yet, so there is nothing to sync.',
      );
    }

    if (this.shipmentDomainService.isTerminal(consignment.status)) {
      // Already concluded — nothing a courier reports can move it further.
      return this.getShipmentDetailsService.execute(consignment.id, tenantId);
    }

    const store = await this.storeRepository.findOne({ where: { tenantId } });
    const adapter = this.courierProviderRegistry.resolve(consignment.courierProvider);
    const credentials = await this.resolveCourierCredentialsService.execute(
      tenantId,
      consignment.courierProvider,
      store,
    );

    let trackingResult;
    try {
      trackingResult = await adapter.trackParcel(consignment.trackingCode, credentials);
      await this.recordCourierApiCallService.execute(tenantId, consignment.courierProvider, true);
    } catch (err) {
      // Health is recorded before rethrowing, so a courier that starts failing
      // shows up in the Couriers tab rather than only in the logs.
      await this.recordCourierApiCallService.execute(
        tenantId,
        consignment.courierProvider,
        false,
      );
      throw err;
    }

    // Deduplicate on status + timestamp so a repeated sync never double-records.
    const existingEvents = await this.consignmentEventRepository.find({
      where: { consignmentId: consignment.id },
    });
    const existingKeys = new Set(
      existingEvents.map((e) => `${e.status}|${e.eventTimestamp.getTime()}`),
    );

    const newEvents = trackingResult.events.filter(
      (event) => !existingKeys.has(`${event.status}|${event.timestamp.getTime()}`),
    );

    const previousStatus = consignment.status;
    const reportedStatus = trackingResult.currentStatus;

    // The courier is not trusted to dictate arbitrary state: an illegal move
    // (e.g. delivered → pending) is logged and ignored rather than applied.
    const shouldApplyStatus =
      reportedStatus !== previousStatus &&
      this.shipmentDomainService.canTransition(previousStatus, reportedStatus);

    if (reportedStatus !== previousStatus && !shouldApplyStatus) {
      this.logger.warn(
        `Ignoring illegal courier transition for ${consignment.shipmentNumber}: ${previousStatus} → ${reportedStatus}.`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      for (const event of newEvents) {
        await manager.save(
          manager.create(ConsignmentEventEntity, {
            consignmentId: consignment.id,
            status: event.status,
            eventTimestamp: event.timestamp,
            location: event.location,
            description: event.description,
          }),
        );
      }

      const codStatus = shouldApplyStatus
        ? this.shipmentDomainService.deriveCodStatus(reportedStatus, consignment.codStatus)
        : undefined;

      await manager.update(
        ConsignmentEntity,
        { id: consignment.id, tenantId },
        {
          ...(shouldApplyStatus ? { status: reportedStatus } : {}),
          ...(codStatus
            ? {
                codStatus,
                ...(codStatus === CodStatusEnum.COLLECTED ? { codCollectedAt: new Date() } : {}),
              }
            : {}),
          lastSyncAt: new Date(),
        },
      );

      if (!shouldApplyStatus) return;

      // Order fulfilment follows the parcel, but only ever moves forward.
      const nextOrderStatus = ORDER_STATUS_BY_SHIPMENT_STATUS[reportedStatus];
      if (!nextOrderStatus) return;

      const order = await manager.findOne(OrderEntity, {
        where: { id: consignment.orderId, tenantId },
        select: ['id', 'orderStatus'],
      });
      if (!order || order.orderStatus === nextOrderStatus) return;

      await manager.update(
        OrderEntity,
        { id: order.id, tenantId },
        { orderStatus: nextOrderStatus },
      );

      await manager.save(
        manager.create(OrderStatusHistoryEntity, {
          orderId: order.id,
          previousStatus: order.orderStatus,
          newStatus: nextOrderStatus,
          changedBy: userId,
          reason: `Synchronised from courier status: ${reportedStatus} (shipment ${consignment.shipmentNumber}).`,
          tenantId,
        }),
      );
    });

    return this.getShipmentDetailsService.execute(consignment.id, tenantId);
  }
}
