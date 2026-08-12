import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReturnEntity } from '../entities/return.entity';

@Injectable()
export class FindReturnsByOrderService {
  constructor(
    @InjectRepository(ReturnEntity)
    private readonly returnRepository: Repository<ReturnEntity>,
  ) {}

  async execute(orderId: string, tenantId: string): Promise<ReturnEntity[]> {
    return this.returnRepository.find({
      where: { orderId, tenantId },
      relations: ['items', 'items.orderItem'],
      order: { requestedAt: 'DESC' },
    });
  }
}
