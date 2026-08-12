import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReturnEntity, ReturnStatusEnum } from '../entities/return.entity';
import { ReturnItemEntity } from '../entities/return-item.entity';
import { OrderEntity, OrderStatusEnum } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { CreateReturnDto } from '../dto/create-return.dto';

@Injectable()
export class CreateReturnService {
  constructor(
    @InjectRepository(ReturnEntity)
    private readonly returnRepository: Repository<ReturnEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(ReturnItemEntity)
    private readonly returnItemRepository: Repository<ReturnItemEntity>,
  ) {}

  async execute(dto: CreateReturnDto, tenantId: string): Promise<ReturnEntity> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, tenantId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.orderStatus !== OrderStatusEnum.DELIVERED && order.orderStatus !== OrderStatusEnum.COMPLETED) {
      throw new BadRequestException('Returns can only be requested for DELIVERED or COMPLETED orders.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item must be returned.');
    }

    const returnItems: ReturnItemEntity[] = [];

    // Calculate previously returned quantities to prevent over-returning
    const existingReturns = await this.returnRepository.find({
      where: { orderId: order.id, tenantId },
      relations: ['items'],
    });

    const returnedQuantities = new Map<string, number>();
    for (const ret of existingReturns) {
      if (ret.status !== ReturnStatusEnum.REJECTED && ret.status !== ReturnStatusEnum.CANCELLED) {
        for (const item of ret.items) {
          returnedQuantities.set(
            item.orderItemId, 
            (returnedQuantities.get(item.orderItemId) || 0) + item.quantity
          );
        }
      }
    }

    for (const itemDto of dto.items) {
      const orderItem = order.items.find(i => i.id === itemDto.orderItemId);
      if (!orderItem) {
        throw new BadRequestException(`Order item ${itemDto.orderItemId} not found in this order.`);
      }

      const alreadyReturned = returnedQuantities.get(orderItem.id) || 0;
      if (itemDto.quantity + alreadyReturned > orderItem.quantity) {
        throw new BadRequestException(
          `Cannot return ${itemDto.quantity} of ${orderItem.productTitle}. Maximum returnable is ${orderItem.quantity - alreadyReturned}.`
        );
      }

      const returnItem = this.returnItemRepository.create({
        orderItemId: orderItem.id,
        quantity: itemDto.quantity,
        reason: itemDto.reason,
        tenantId,
      });

      returnItems.push(returnItem);
    }

    const returnNumber = `RET-${Math.floor(100000 + Math.random() * 900000)}`;

    const newReturn = this.returnRepository.create({
      returnNumber,
      orderId: order.id,
      status: ReturnStatusEnum.REQUESTED,
      note: dto.note,
      tenantId,
      items: returnItems,
    });

    return await this.returnRepository.save(newReturn);
  }
}
