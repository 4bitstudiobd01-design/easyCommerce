import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum, PaymentMethodEnum } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { AdjustStockService } from '../../inventory/services/adjust-stock.service';
import { StockAdjustmentAction } from '../../inventory/dto/adjust-stock.dto';
import { TriggerOrderStatusSmsService } from '../../sms/services/trigger-order-status-sms.service';
import { ApplyCouponService } from '../../coupon/services/apply-coupon.service';

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
    private readonly triggerOrderStatusSmsService: TriggerOrderStatusSmsService,
    private readonly applyCouponService: ApplyCouponService,
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
    const deductedItems: { productId: string; quantity: number }[] = [];

    // Process order items
    try {
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

        // Adjust physical stock count in Inventory module.
        // Throws if there isn't enough stock on hand — caught below so we can
        // roll back any deductions already made for earlier items in this order.
        await this.adjustStockService.execute(tenantId, {
          productId: product.id,
          quantity: itemDto.quantity,
          action: StockAdjustmentAction.REMOVE,
        });
        deductedItems.push({ productId: product.id, quantity: itemDto.quantity });
      }
    } catch (err) {
      await this.rollbackStock(tenantId, deductedItems);
      throw err;
    }

    let discountAmount = 0;
    let appliedCouponCode: string | undefined;

    if (dto.couponCode) {
      try {
        // Re-validate and atomically increment usage server-side — never trust
        // a discount amount the client claims to have already applied.
        const applied = await this.applyCouponService.execute(tenantId, dto.couponCode, subtotal);
        discountAmount = applied.discountAmount;
        appliedCouponCode = applied.code;
      } catch (err) {
        await this.rollbackStock(tenantId, deductedItems);
        throw err;
      }
    }

    const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);
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
      discountAmount,
      couponCode: appliedCouponCode,
      grandTotal,
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentMethod === PaymentMethodEnum.COD ? PaymentStatusEnum.COD_PENDING : PaymentStatusEnum.UNPAID,
      orderStatus: OrderStatusEnum.PENDING,
      storeSlug: dto.storeSlug,
      tenantId,
      items: orderItems,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Trigger Order Placement SMS
    try {
      await this.triggerOrderStatusSmsService.execute({
        orderNumber: savedOrder.orderNumber,
        customerPhone: savedOrder.customerPhone,
        customerName: savedOrder.customerName,
        storeName: store.name,
        grandTotal: Number(savedOrder.grandTotal),
        orderStatus: 'PENDING',
        tenantId: savedOrder.tenantId,
      });
    } catch (err) {
      // Non-blocking SMS trigger
    }

    return savedOrder;
  }

  private async rollbackStock(
    tenantId: string,
    deductedItems: { productId: string; quantity: number }[],
  ): Promise<void> {
    for (const deducted of deductedItems) {
      try {
        await this.adjustStockService.execute(tenantId, {
          productId: deducted.productId,
          quantity: deducted.quantity,
          action: StockAdjustmentAction.ADD,
        });
      } catch (rollbackErr) {
        // Best-effort rollback; the original error is still surfaced to the caller.
      }
    }
  }
}
