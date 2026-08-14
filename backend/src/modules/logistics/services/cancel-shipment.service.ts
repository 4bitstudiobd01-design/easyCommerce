import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  CodStatusEnum,
  ConsignmentEntity,
  ConsignmentStatusEnum,
} from '../entities/consignment.entity';
import { ConsignmentEventEntity } from '../entities/consignment-event.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderStatusHistoryEntity } from '../../order/entities/order-status-history.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { ShipmentDomainService, CONSIGNMENT_STATUS_LABELS } from './shipment-domain.service';
import { GetShipmentDetailsService } from './get-shipment-details.service';
import { ShipmentDetailsResponseDto } from '../dto/shipment-details-response.dto';

@Injectable()
export class CancelShipmentService {
  private readonly logger = new Logger(CancelShipmentService.name);

  constructor(
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    private readonly courierProviderRegistry: CourierProviderRegistry,
    private readonly shipmentDomainService: ShipmentDomainService,
    private readonly getShipmentDetailsService: GetShipmentDetailsService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    shipmentId: string,
    tenantId: string,
    userId: string,
    reason?: string,
  ): Promise<ShipmentDetailsResponseDto> {
    const consignment = await this.consignmentRepository.findOne({
      where: { id: shipmentId, tenantId },
    });

    if (!consignment) {
      throw new NotFoundException('Shipment not found.');
    }

    // Cancelling twice is rejected, as is cancelling a parcel the courier has
    // already collected — the domain rules decide, not the caller.
    if (!this.shipmentDomainService.isCancellable(consignment.status)) {
      throw new BadRequestException(
        `A shipment that is ${CONSIGNMENT_STATUS_LABELS[consignment.status].toLowerCase()} cannot be cancelled.`,
      );
    }

    // Tell the courier where one was actually booked. A provider that cannot
    // cancel programmatically reports so, and the merchant is told.
    let courierMessage: string | undefined;
    if (consignment.trackingCode) {
      const store = await this.storeRepository.findOne({ where: { tenantId } });
      const adapter = this.courierProviderRegistry.resolve(consignment.courierProvider);
      try {
        const result = await adapter.cancelParcel(consignment.trackingCode, {
          apiKey: store?.steadfastApiKey,
          secretKey: store?.steadfastSecretKey,
          clientId: store?.pathaoClientId,
          clientSecret: store?.pathaoClientSecret,
        });
        courierMessage = result.message;
      } catch (err) {
        this.logger.error(
          `Courier cancellation failed for ${consignment.shipmentNumber}: ${err?.message}`,
        );
        courierMessage =
          'The courier could not be reached — confirm the cancellation with them directly.';
      }
    }

    const note = ['Shipment cancelled by merchant.', reason, courierMessage]
      .filter(Boolean)
      .join(' ');

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        ConsignmentEntity,
        { id: consignment.id, tenantId },
        {
          status: ConsignmentStatusEnum.CANCELLED,
          // Cash that will never be collected must leave the pending COD ledger.
          ...(consignment.codStatus === CodStatusEnum.PENDING
            ? { codStatus: CodStatusEnum.RETURNED }
            : {}),
        },
      );

      await manager.save(
        manager.create(ConsignmentEventEntity, {
          consignmentId: consignment.id,
          status: ConsignmentStatusEnum.CANCELLED,
          eventTimestamp: new Date(),
          description: note,
        }),
      );

      // The order itself is left where it is: cancelling a parcel does not
      // cancel the sale, and the merchant may book a replacement shipment. The
      // history row records the unchanged status purely as an audit entry.
      const order = await manager.findOne(OrderEntity, {
        where: { id: consignment.orderId, tenantId },
        select: ['id', 'orderStatus'],
      });

      if (order) {
        await manager.save(
          manager.create(OrderStatusHistoryEntity, {
            orderId: consignment.orderId,
            previousStatus: order.orderStatus,
            newStatus: order.orderStatus,
            changedBy: userId,
            reason: `Shipment ${consignment.shipmentNumber} cancelled. ${note}`,
            tenantId,
          }),
        );
      }
    });

    return this.getShipmentDetailsService.execute(consignment.id, tenantId);
  }
}
