import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';

@Injectable()
export class FindOrderByIdService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
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

    return order;
  }
}
