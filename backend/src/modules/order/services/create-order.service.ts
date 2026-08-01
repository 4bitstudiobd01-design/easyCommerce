import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { AdjustStockService } from '../../inventory/services/adjust-stock.service';
import { StockAdjustmentAction } from '../../inventory/dto/adjust-stock.dto';

@Injectable()
export class CreateOrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly findStoreBySlugService: FindStoreBySlugService,
    private readonly adjustStockService: AdjustStockService,
  ) {}

  async execute(dto: CreateOrderDto): Promise<OrderEntity> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    const store = await this.findStoreBySlugService.execute(dto.storeSlug);
    const tenantId = store.tenantId;

    // Delivery fee logic
    const isDhaka = dto.city.toLowerCase().includes('dhaka');
    const deliveryFee = isDhaka ? 60 : 120;

    let subtotal = 0;
    const orderItems: OrderItemEntity[] = [];

    // Process order items
    for (const itemDto of dto.items) {
      const product = await this.productRepository.findOne({
        where: { id: itemDto.productId, tenantId },
        relations: ['variants'],
      });

      if (!product) {
        throw new NotFoundException(`Product with ID "${itemDto.productId}" not found.`);
      }

      const unitPrice = Number(product.basePrice);
      const totalPrice = unitPrice * itemDto.quantity;
      subtotal += totalPrice;

      const sku = product.variants?.[0]?.sku || `SKU-${product.id.slice(0, 6)}`;

      const orderItem = this.orderItemRepository.create({
        productId: product.id,
        productTitle: product.title,
        sku,
        unitPrice,
        quantity: itemDto.quantity,
        totalPrice,
        tenantId,
      });

      orderItems.push(orderItem);

      // Adjust physical stock count in Inventory module
      try {
        await this.adjustStockService.execute(tenantId, {
          productId: product.id,
          quantity: itemDto.quantity,
          action: StockAdjustmentAction.REMOVE,
        });
      } catch (err) {
        // Continue even if stock adjustment is non-blocking
      }
    }

    const grandTotal = subtotal + deliveryFee;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const order = this.orderRepository.create({
      orderNumber,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      shippingAddress: dto.shippingAddress,
      city: dto.city,
      deliveryFee,
      subtotal,
      grandTotal,
      paymentMethod: dto.paymentMethod,
      paymentStatus: PaymentStatusEnum.UNPAID,
      orderStatus: OrderStatusEnum.PENDING,
      storeSlug: dto.storeSlug,
      tenantId,
      items: orderItems,
    });

    return this.orderRepository.save(order);
  }
}
