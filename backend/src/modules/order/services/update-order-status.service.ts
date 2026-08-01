import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum } from '../entities/order.entity';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { TriggerOrderStatusSmsService } from '../../sms/services/trigger-order-status-sms.service';
import { ConsignmentEntity } from '../../logistics/entities/consignment.entity';

@Injectable()
export class UpdateOrderStatusService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    private readonly triggerOrderStatusSmsService: TriggerOrderStatusSmsService,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateOrderStatusDto): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found.`);
    }

    order.orderStatus = dto.orderStatus;

    if (dto.orderStatus === OrderStatusEnum.DELIVERED) {
      order.paymentStatus = PaymentStatusEnum.PAID;
    }

    const savedOrder = await this.orderRepository.save(order);

    // Fetch consignment if shipped
    let consignment: ConsignmentEntity | null = null;
    if (dto.orderStatus === OrderStatusEnum.SHIPPED) {
      consignment = await this.consignmentRepository.findOne({ where: { orderId: order.id } });
    }

    // Trigger Order Status Mutation SMS
    try {
      await this.triggerOrderStatusSmsService.execute({
        orderNumber: savedOrder.orderNumber,
        customerPhone: savedOrder.customerPhone,
        customerName: savedOrder.customerName,
        storeName: savedOrder.storeSlug,
        grandTotal: Number(savedOrder.grandTotal),
        orderStatus: dto.orderStatus,
        tenantId: savedOrder.tenantId,
        courierProvider: consignment?.courierProvider,
        trackingCode: consignment?.trackingCode,
      });
    } catch (err) {
      // Non-blocking SMS trigger
    }

    return savedOrder;
  }
}
