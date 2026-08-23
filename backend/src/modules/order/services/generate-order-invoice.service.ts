import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';

export interface InvoiceData {
  order: OrderEntity;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  generatedAt: string;
}

@Injectable()
export class GenerateOrderInvoiceService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  async execute(orderId: string, userId: string): Promise<InvoiceData> {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new NotFoundException('Merchant store not found.');
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId: store.tenantId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    return {
      order,
      storeName: store.name,
      storePhone: store.phone || 'N/A',
      storeAddress: store.address || 'Dhaka, Bangladesh',
      generatedAt: new Date().toISOString(),
    };
  }
}
