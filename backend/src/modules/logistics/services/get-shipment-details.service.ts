import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsignmentEntity } from '../entities/consignment.entity';
import { ConsignmentEventEntity } from '../entities/consignment-event.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { ListShipmentsService } from './list-shipments.service';
import { ShipmentDomainService, CONSIGNMENT_STATUS_LABELS } from './shipment-domain.service';
import { ShipmentDetailsResponseDto } from '../dto/shipment-details-response.dto';

@Injectable()
export class GetShipmentDetailsService {
  constructor(
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    @InjectRepository(ConsignmentEventEntity)
    private readonly consignmentEventRepository: Repository<ConsignmentEventEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly listShipmentsService: ListShipmentsService,
    private readonly shipmentDomainService: ShipmentDomainService,
  ) {}

  async execute(
    shipmentId: string,
    tenantId: string,
    currency = 'BDT',
  ): Promise<ShipmentDetailsResponseDto> {
    // Tenant scope is part of the lookup, so a valid ID belonging to another
    // merchant is indistinguishable from one that does not exist.
    const consignment = await this.consignmentRepository.findOne({
      where: { id: shipmentId, tenantId },
    });

    if (!consignment) {
      throw new NotFoundException('Shipment not found.');
    }

    const [order, events] = await Promise.all([
      this.orderRepository.findOne({
        where: { id: consignment.orderId, tenantId },
        select: ['id', 'customerId', 'customerName', 'customerPhone', 'shippingAddress'],
      }),
      // Real recorded events only — the timeline is never invented.
      this.consignmentEventRepository.find({
        where: { consignmentId: consignment.id },
        order: { eventTimestamp: 'ASC' },
      }),
    ]);

    const base = this.listShipmentsService.toListItem(
      consignment,
      {
        customerName: order?.customerName,
        customerPhone: order?.customerPhone,
        customerId: order?.customerId,
      },
      currency,
    );

    return {
      ...base,
      pickupAddress: consignment.pickupAddress ?? '',
      deliveryAddress: consignment.recipientAddress,
      parcelType: consignment.parcelType,
      parcelDimensions: consignment.parcelDimensions ?? undefined,
      deliveryCharge: Number(consignment.deliveryCharge) || 0,
      deliveryNote: consignment.deliveryNote ?? undefined,
      specialInstructions: consignment.specialInstructions ?? undefined,
      codCollectedAt: consignment.codCollectedAt ?? undefined,
      codSettledAt: consignment.codSettledAt ?? undefined,
      lastSyncAt: consignment.lastSyncAt ?? undefined,
      timeline: events.map((event) => ({
        id: event.id,
        status: event.status,
        statusLabel: CONSIGNMENT_STATUS_LABELS[event.status] ?? event.status,
        timestamp: event.eventTimestamp,
        location: event.location ?? undefined,
        description: event.description ?? undefined,
      })),
      allowedTransitions: [
        ...this.shipmentDomainService.allowedTransitions(consignment.status),
      ],
    };
  }
}
