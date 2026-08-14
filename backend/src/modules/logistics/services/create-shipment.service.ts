import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  ConsignmentEntity,
  ConsignmentStatusEnum,
  CodStatusEnum,
} from '../entities/consignment.entity';
import { ConsignmentEventEntity } from '../entities/consignment-event.entity';
import {
  OrderEntity,
  OrderStatusEnum,
  PaymentStatusEnum,
} from '../../order/entities/order.entity';
import { OrderStatusHistoryEntity } from '../../order/entities/order-status-history.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { ShipmentDetailsResponseDto } from '../dto/shipment-details-response.dto';
import { GetShipmentDetailsService } from './get-shipment-details.service';

/** Orders that are cancelled or already concluded can never be shipped. */
const NON_SHIPPABLE_ORDER_STATUSES: readonly OrderStatusEnum[] = [
  OrderStatusEnum.CANCELLED,
  OrderStatusEnum.RETURNED,
  OrderStatusEnum.DELIVERED,
  OrderStatusEnum.COMPLETED,
];

@Injectable()
export class CreateShipmentService {
  private readonly logger = new Logger(CreateShipmentService.name);

  constructor(
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    private readonly courierProviderRegistry: CourierProviderRegistry,
    private readonly getShipmentDetailsService: GetShipmentDetailsService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    dto: CreateShipmentDto,
    tenantId: string,
    userId: string,
  ): Promise<ShipmentDetailsResponseDto> {
    // 1. Idempotency — a retry or double-click returns the original shipment
    //    instead of booking a second parcel with the courier.
    if (dto.idempotencyKey) {
      const existing = await this.consignmentRepository.findOne({
        where: { tenantId, idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        return this.getShipmentDetailsService.execute(existing.id, tenantId);
      }
    }

    // 2. Validate the order — scoped to the tenant, so one merchant can never
    //    create a shipment against another merchant's order.
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, tenantId },
    });
    if (!order) {
      throw new NotFoundException('Order not found.');
    }
    if (NON_SHIPPABLE_ORDER_STATUSES.includes(order.orderStatus)) {
      throw new BadRequestException(
        `Order #${order.orderNumber} is ${order.orderStatus.toLowerCase()} and can no longer be shipped.`,
      );
    }

    // 3. One active parcel per order. A cancelled shipment frees the order so a
    //    replacement can be booked.
    const activeShipment = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .where('consignment."tenantId" = :tenantId', { tenantId })
      .andWhere('consignment."orderId" = :orderId', { orderId: order.id })
      .andWhere('consignment.status != :cancelled', {
        cancelled: ConsignmentStatusEnum.CANCELLED,
      })
      .getOne();

    if (activeShipment) {
      throw new ConflictException(
        `A shipment (${activeShipment.shipmentNumber}) already exists for order #${order.orderNumber}.`,
      );
    }

    // 4. Validate the delivery address before involving the courier.
    const deliveryAddress = (dto.deliveryAddress || order.shippingAddress || '').trim();
    if (!deliveryAddress) {
      throw new BadRequestException(
        'A delivery address is required. Add one to the order or supply it with the shipment.',
      );
    }
    const customerPhone = (dto.customerPhone || order.customerPhone || '').trim();
    if (!customerPhone) {
      throw new BadRequestException('A customer phone number is required for courier delivery.');
    }

    const store = await this.storeRepository.findOne({ where: { tenantId } });
    const pickupAddress = (dto.pickupAddress || store?.address || '').trim();

    // 5. COD: never collect cash twice. A prepaid order ships with no COD due.
    const isPrepaid =
      order.paymentStatus === PaymentStatusEnum.PAID ||
      order.paymentStatus === PaymentStatusEnum.COD_COLLECTED;
    const codAmount = isPrepaid ? 0 : (dto.codAmount ?? Number(order.grandTotal) ?? 0);
    const codStatus =
      codAmount > 0 ? CodStatusEnum.PENDING : CodStatusEnum.NOT_APPLICABLE;

    // 6. Validate the courier is supported — throws for an unknown provider.
    const adapter = this.courierProviderRegistry.resolve(dto.courierProvider);

    const shipmentNumber = await this.generateShipmentNumber(tenantId);

    // 7. Call the courier. A provider failure must not leave a half-written
    //    shipment behind, so nothing is persisted until this resolves.
    let trackingCode: string | null = null;
    let bookingStatus = ConsignmentStatusEnum.PENDING;
    let bookingNote = 'Shipment created. Awaiting courier booking confirmation.';

    try {
      const result = await adapter.bookParcel({
        invoice: order.orderNumber,
        recipientName: order.customerName,
        recipientPhone: customerPhone,
        recipientAddress: deliveryAddress,
        city: order.city,
        codAmount,
        note: dto.deliveryNote,
        weight: dto.parcelWeight ?? 0.5,
        apiKey: store?.steadfastApiKey,
        secretKey: store?.steadfastSecretKey,
        clientId: store?.pathaoClientId,
        clientSecret: store?.pathaoClientSecret,
      });

      trackingCode = result.trackingCode;
      bookingStatus = ConsignmentStatusEnum.BOOKED;
      bookingNote = `Booked with ${adapter.displayName}. Tracking code ${result.trackingCode}.`;
    } catch (err) {
      // The parcel is kept as PENDING with no tracking code so the merchant can
      // retry, rather than losing the shipment or showing a fabricated booking.
      this.logger.error(
        `Courier booking failed for order ${order.orderNumber} via ${dto.courierProvider}: ${err?.message}`,
      );
      bookingNote = `Courier booking failed: ${err?.message ?? 'provider unavailable'}. Shipment saved as pending — retry booking from the shipment.`;
    }

    // 8. Persist the shipment, its first tracking event and the order history
    //    together, so a failure can never leave them disagreeing.
    const shipmentId = await this.dataSource.transaction(async (manager) => {
      const consignment = await manager.save(
        manager.create(ConsignmentEntity, {
          shipmentNumber,
          trackingCode,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId ?? null,
          courierProvider: dto.courierProvider,
          recipientName: order.customerName,
          recipientPhone: customerPhone,
          recipientAddress: deliveryAddress,
          city: order.city,
          pickupAddress: pickupAddress || null,
          codAmount,
          codStatus,
          deliveryCharge: Number(order.deliveryFee) || 0,
          parcelWeight: dto.parcelWeight ?? 0.5,
          parcelType: dto.parcelType ?? 'PARCEL',
          parcelDimensions: dto.parcelDimensions ?? null,
          deliveryNote: dto.deliveryNote ?? null,
          specialInstructions: dto.specialInstructions ?? null,
          status: bookingStatus,
          idempotencyKey: dto.idempotencyKey ?? null,
          tenantId,
        }),
      );

      await manager.save(
        manager.create(ConsignmentEventEntity, {
          consignmentId: consignment.id,
          status: bookingStatus,
          eventTimestamp: new Date(),
          description: bookingNote,
        }),
      );

      // 9. Order fulfilment state is owned by the order domain — the shipment
      //    only records that a parcel now exists, and moves the order forward
      //    to READY_TO_SHIP when it is still earlier in the flow.
      const shouldAdvanceOrder =
        bookingStatus === ConsignmentStatusEnum.BOOKED &&
        [
          OrderStatusEnum.PENDING,
          OrderStatusEnum.ON_HOLD,
          OrderStatusEnum.CONFIRMED,
          OrderStatusEnum.PROCESSING,
        ].includes(order.orderStatus);

      if (shouldAdvanceOrder) {
        await manager.update(OrderEntity, { id: order.id, tenantId }, {
          orderStatus: OrderStatusEnum.READY_TO_SHIP,
        });
      }

      await manager.save(
        manager.create(OrderStatusHistoryEntity, {
          orderId: order.id,
          previousStatus: shouldAdvanceOrder ? order.orderStatus : undefined,
          newStatus: shouldAdvanceOrder ? OrderStatusEnum.READY_TO_SHIP : order.orderStatus,
          changedBy: userId,
          reason: `Shipment ${shipmentNumber} created. ${bookingNote}`,
          tenantId,
        }),
      );

      return consignment.id;
    });

    return this.getShipmentDetailsService.execute(shipmentId, tenantId);
  }

  /**
   * Sequential, tenant-scoped shipment reference (SHP-10245).
   *
   * Derived from the tenant's own highest existing number, so two merchants
   * never influence each other's numbering.
   */
  private async generateShipmentNumber(tenantId: string): Promise<string> {
    const row = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .select(
        `MAX(CAST(NULLIF(REGEXP_REPLACE(consignment."shipmentNumber", '\\D', '', 'g'), '') AS BIGINT))`,
        'maxNumber',
      )
      .where('consignment."tenantId" = :tenantId', { tenantId })
      .getRawOne<{ maxNumber: string | null }>();

    const next = Math.max(10000, Number(row?.maxNumber ?? 0)) + 1;
    return `SHP-${next}`;
  }
}
