import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum } from '../entities/order.entity';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';

@Injectable()
export class UpdateOrderStatusService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
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

    return this.orderRepository.save(order);
  }
}
