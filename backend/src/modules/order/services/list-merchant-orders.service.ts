import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';

@Injectable()
export class ListMerchantOrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async execute(tenantId: string): Promise<OrderEntity[]> {
    return this.orderRepository.find({
      where: { tenantId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }
}
