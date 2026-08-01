import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { ConsignmentEntity } from '../../logistics/entities/consignment.entity';

export interface PublicOrderTrackingResult {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  grandTotal: number;
  deliveryFee: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  storeSlug: string;
  createdAt: Date;
  items: {
    productId: string;
    productTitle: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }[];
  consignment?: {
    trackingCode: string;
    courierProvider: string;
    status: string;
    codAmount: number;
    createdAt: Date;
  };
}

@Injectable()
export class TrackPublicOrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
  ) {}

  async execute(query: string, storeSlug?: string): Promise<PublicOrderTrackingResult[]> {
    const sanitizedQuery = query.trim().replace('#', '');

    const whereConditions: any[] = [
      { orderNumber: sanitizedQuery },
      { customerPhone: sanitizedQuery },
    ];

    if (storeSlug) {
      whereConditions[0].storeSlug = storeSlug;
      whereConditions[1].storeSlug = storeSlug;
    }

    const orders = await this.orderRepository.find({
      where: whereConditions,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    if (!orders || orders.length === 0) {
      throw new NotFoundException(`No orders found matching "${query}". Please check your order number or phone number.`);
    }

    const results: PublicOrderTrackingResult[] = [];

    for (const order of orders) {
      const consignment = await this.consignmentRepository.findOne({
        where: { orderId: order.id },
      });

      results.push({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        city: order.city,
        grandTotal: Number(order.grandTotal),
        deliveryFee: Number(order.deliveryFee),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        storeSlug: order.storeSlug,
        createdAt: order.createdAt,
        items: (order.items || []).map((item) => ({
          productId: item.productId,
          productTitle: item.productTitle,
          quantity: item.quantity,
          price: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        consignment: consignment
          ? {
              trackingCode: consignment.trackingCode,
              courierProvider: consignment.courierProvider,
              status: consignment.status,
              codAmount: Number(consignment.codAmount),
              createdAt: consignment.createdAt,
            }
          : undefined,
      });
    }

    return results;
  }
}
