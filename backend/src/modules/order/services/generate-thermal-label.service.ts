import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { ConsignmentEntity } from '../../logistics/entities/consignment.entity';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';

export interface ThermalLabelData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  grandTotal: number;
  paymentMethod: string;
  storeName: string;
  storePhone: string;
  courierProvider?: string;
  trackingCode?: string;
}

@Injectable()
export class GenerateThermalLabelService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  async execute(orderId: string, userId: string): Promise<ThermalLabelData> {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new NotFoundException('Merchant store not found.');
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId: store.tenantId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    const consignment = await this.consignmentRepository.findOne({
      where: { orderId: order.id },
    });

    return {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      city: order.city,
      grandTotal: Number(order.grandTotal),
      paymentMethod: order.paymentMethod,
      storeName: store.name,
      storePhone: store.phone || 'N/A',
      courierProvider: consignment?.courierProvider || 'STEADFAST',
      trackingCode: consignment?.trackingCode || `WAYBILL-${order.orderNumber}`,
    };
  }
}
