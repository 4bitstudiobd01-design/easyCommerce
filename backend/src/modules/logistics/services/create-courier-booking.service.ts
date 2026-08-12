import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsignmentEntity, ConsignmentStatusEnum, CourierProviderEnum } from '../entities/consignment.entity';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum } from '../../order/entities/order.entity';
import { OrderStatusHistoryEntity } from '../../order/entities/order-status-history.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { CreateCourierBookingDto } from '../dto/create-courier-booking.dto';
import { SteadfastCourierAdapter } from '../adapters/steadfast.adapter';
import { PathaoCourierAdapter } from '../adapters/pathao.adapter';
import { CourierBookingResult } from '../adapters/courier.adapter';

@Injectable()
export class CreateCourierBookingService {
  constructor(
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly orderStatusHistoryRepository: Repository<OrderStatusHistoryEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    private readonly steadfastAdapter: SteadfastCourierAdapter,
    private readonly pathaoAdapter: PathaoCourierAdapter,
  ) {}

  async execute(dto: CreateCourierBookingDto, tenantId: string, userId: string): Promise<ConsignmentEntity> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${dto.orderId}" not found.`);
    }

    if (order.orderStatus !== OrderStatusEnum.READY_TO_SHIP) {
      throw new BadRequestException(`Order must be in READY_TO_SHIP status to book a courier. Current status: ${order.orderStatus}`);
    }

    const existingConsignment = await this.consignmentRepository.findOne({
      where: { orderId: order.id, tenantId },
    });

    if (existingConsignment) {
      throw new BadRequestException(
        `Parcel consignment already booked for Order #${order.orderNumber} (Tracking Code: ${existingConsignment.trackingCode}).`,
      );
    }

    const store = await this.storeRepository.findOne({ where: { tenantId } });

    const codAmount = order.paymentStatus === PaymentStatusEnum.PAID ? 0 : Number(order.grandTotal);

    // Dynamic Courier Adapter Execution
    let bookingResult: CourierBookingResult = {
      trackingCode: `TRX-${order.orderNumber}`,
      consignmentId: '',
      status: 'BOOKED',
    };

    if (dto.courierProvider === CourierProviderEnum.PATHAO) {
      bookingResult = await this.pathaoAdapter.bookParcel({
        invoice: order.orderNumber,
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        recipientAddress: order.shippingAddress,
        city: order.city,
        codAmount,
        note: dto.note,
        clientId: store?.pathaoClientId,
        clientSecret: store?.pathaoClientSecret,
      });
    } else {
      bookingResult = await this.steadfastAdapter.bookParcel({
        invoice: order.orderNumber,
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        recipientAddress: order.shippingAddress,
        city: order.city,
        codAmount,
        note: dto.note,
        apiKey: store?.steadfastApiKey,
        secretKey: store?.steadfastSecretKey,
      });
    }

    const consignment = this.consignmentRepository.create({
      trackingCode: bookingResult.trackingCode,
      orderId: order.id,
      orderNumber: order.orderNumber,
      courierProvider: dto.courierProvider,
      recipientName: order.customerName,
      recipientPhone: order.customerPhone,
      recipientAddress: order.shippingAddress,
      city: order.city,
      codAmount,
      deliveryCharge: Number(order.deliveryFee),
      status: ConsignmentStatusEnum.BOOKED,
      tenantId,
    });

    const savedConsignment = await this.consignmentRepository.save(consignment);

    // Create a history log for the booking event without mutating the order state
    const history = this.orderStatusHistoryRepository.create({
      orderId: order.id,
      newStatus: order.orderStatus, // Status remains READY_TO_SHIP
      changedBy: userId,
      reason: `Courier booked via ${dto.courierProvider}. Consignment ID: ${bookingResult.trackingCode}`,
      tenantId,
    });
    await this.orderStatusHistoryRepository.save(history);

    return savedConsignment;
  }
}
