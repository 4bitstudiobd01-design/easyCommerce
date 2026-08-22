import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../entities/payment.entity';

@Injectable()
export class GetOrderPaymentHistoryService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  async execute(tenantId: string, orderId: string): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({
      where: { tenantId, orderId },
      order: { createdAt: 'DESC' },
    });
  }
}
