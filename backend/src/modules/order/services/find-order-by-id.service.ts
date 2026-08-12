import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';
import { ConsignmentEntity } from '../../logistics/entities/consignment.entity';

@Injectable()
export class FindOrderByIdService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly statusHistoryRepository: Repository<OrderStatusHistoryEntity>,
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
  ) {}

  async execute(id: string, tenantId?: string): Promise<OrderEntity> {
    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const order = await this.orderRepository.findOne({
      where,
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found.`);
    }

    // Fetch decoupled domain data
    const statusHistory = await this.statusHistoryRepository.find({
      where: { orderId: id },
      order: { createdAt: 'DESC' },
    });

    const consignment = await this.consignmentRepository.findOne({
      where: { orderId: id },
      relations: ['events'],
    });

    if (consignment && consignment.events) {
      consignment.events.sort((a, b) => b.eventTimestamp.getTime() - a.eventTimestamp.getTime());
    }

    order.statusHistory = statusHistory;
    order.consignment = consignment || undefined;

    return order;
  }
}
