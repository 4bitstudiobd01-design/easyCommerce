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

  async execute(id: string, tenantId: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found.`);
    }

    // Fetch decoupled domain data
    const [statusHistory, consignment] = await Promise.all([
      this.statusHistoryRepository.find({
        where: { orderId: id, tenantId },
        order: { createdAt: 'DESC' },
      }),
      this.consignmentRepository.findOne({
        where: { orderId: id, tenantId },
        relations: ['events'],
      }),
    ]);

    if (consignment && consignment.events) {
      consignment.events.sort((a, b) => b.eventTimestamp.getTime() - a.eventTimestamp.getTime());
    }

    order.statusHistory = statusHistory;
    order.consignment = consignment || undefined;

    return order;
  }
}
