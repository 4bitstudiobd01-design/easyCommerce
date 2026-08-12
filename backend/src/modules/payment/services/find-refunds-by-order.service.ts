import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefundEntity } from '../entities/refund.entity';

@Injectable()
export class FindRefundsByOrderService {
  constructor(
    @InjectRepository(RefundEntity)
    private readonly refundRepository: Repository<RefundEntity>,
  ) {}

  async execute(orderId: string, tenantId: string): Promise<RefundEntity[]> {
    return this.refundRepository.find({
      where: { orderId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }
}
