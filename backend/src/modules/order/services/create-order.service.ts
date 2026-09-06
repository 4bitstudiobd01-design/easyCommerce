import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum, PaymentMethodEnum } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { AdjustStockService } from '../../inventory/services/adjust-stock.service';
import { StockAdjustmentAction } from '../../inventory/dto/adjust-stock.dto';
import { TriggerOrderStatusSmsService } from '../../sms/services/trigger-order-status-sms.service';
import { ApplyCouponService } from '../../coupon/services/apply-coupon.service';
import { FindOrCreateCustomerService } from '../../customer/services/find-or-create-customer.service';
import { RecordCustomerActivityService } from '../../customer/services/record-customer-activity.service';
import { normalizeChannel } from '../../../common/utils/normalize-channel.util';
import { LeadEntity, LeadStageEnum } from '../../customer/entities/lead.entity';
import { GenerateOrderNumberService } from './generate-order-number.service';
import { AbandonedCartService } from './abandoned-cart.service';

@Injectable()
export class CreateOrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly findStoreBySlugService: FindStoreBySlugService,
    private readonly adjustStockService: AdjustStockService,
    private readonly triggerOrderStatusSmsService: TriggerOrderStatusSmsService,
    private readonly applyCouponService: ApplyCouponService,
    private readonly findOrCreateCustomerService: FindOrCreateCustomerService,
    private readonly generateOrderNumberService: GenerateOrderNumberService,
    private readonly recordCustomerActivityService: RecordCustomerActivityService,
    private readonly abandonedCartService: AbandonedCartService,
  ) {}

  async execute(dto: CreateOrderDto): Promise<OrderEntity> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    const store = await this.findStoreBySlugService.execute(dto.storeSlug);
    const tenantId = store.tenantId;

    // Flat delivery charge by zone, taken from store settings. The checkout sends
    // an explicit zone; older/other callers that omit it fall back to inferring
    // "inside Dhaka" from the city name. Store defaults are 60 / 120.
    const insideDhakaCharge = Number(store.deliveryChargeInsideDhaka ?? 60);
    const outsideDhakaCharge = Number(store.deliveryChargeOutsideDhaka ?? 120);
    const isInsideDhaka =
      dto.deliveryZone
        ? dto.deliveryZone === 'INSIDE_DHAKA'
        : (dto.city ?? '').toLowerCase().includes('dhaka');
    const deliveryFee = isInsideDhaka ? insideDhakaCharge : outsideDhakaCharge;

    let subtotal = 0;
    const orderItems: OrderItemEntity[] = [];
    const deductedItems: { productId: string; quantity: number; variantId?: string }[] = [];

    // Process order items
    try {
      for (const itemDto of dto.items) {
        const product = await this.productRepository.findOne({
          where: { id: itemDto.productId, tenantId },
          relations: ['variants', 'images'],
        });

        if (!product) {
          throw new NotFoundException(`Product with ID "${itemDto.productId}" not found.`);
        }

        // When a variantId is provided, resolve and validate it belongs to this
        // product, then price/SKU from the variant instead of the product default.
        // Falls back to today's product-level behavior when no variantId is sent.
        let variant: (typeof product.variants)[number] | undefined;
        if (itemDto.variantId) {
          variant = product.variants?.find((v) => v.id === itemDto.variantId);
          if (!variant) {
            throw new NotFoundException(
              `Variant with ID "${itemDto.variantId}" not found on product "${product.id}".`,
            );
          }
        }

        const unitPrice = variant ? Number(variant.price ?? product.basePrice) : Number(product.basePrice);
        const totalPrice = unitPrice * itemDto.quantity;
        subtotal += totalPrice;

        const sku = variant?.sku || product.variants?.[0]?.sku || `SKU-${product.id.slice(0, 6)}`;
        const primaryImage = product.images?.find((image) => image.isPrimary) ?? product.images?.[0];

        const orderItem = this.orderItemRepository.create({
          productId: product.id,
          productTitle: product.name || product.title || 'Product',
          variantId: variant?.id,
          variantTitle: variant?.title,
          sku,
          productImageUrl: variant?.image?.url ?? primaryImage?.url ?? null,
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
          variantId: variant?.id,
          quantity: itemDto.quantity,
          action: StockAdjustmentAction.REMOVE,
        });
        deductedItems.push({ productId: product.id, quantity: itemDto.quantity, variantId: variant?.id });
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

    let orderNumber: string;
    try {
      orderNumber = await this.dataSource.transaction((manager) =>
        this.generateOrderNumberService.execute(manager, tenantId, store.orderNumberPrefix),
      );
    } catch (err) {
      await this.rollbackStock(tenantId, deductedItems);
      throw err;
    }

    // Link the order to a durable customer record. Keyed on (tenantId, customerPhone).
    // Automatically tags as GUEST if checkout without login, or ACTIVE / REGISTERED if logged in.
    const isGuest = dto.isGuest ?? (dto.userId ? false : true);
    const customer = await this.findOrCreateCustomerService.execute(tenantId, {
      phone: dto.customerPhone,
      name: dto.customerName,
      email: dto.customerEmail,
      storeId: store.id,
      userId: dto.userId,
      isGuest,
      address: {
        recipientName: dto.customerName,
        phone: dto.customerPhone,
        addressLine1: dto.shippingAddress ?? '',
        city: dto.city ?? '',
      },
    });

    const order = this.orderRepository.create({
      orderNumber,
      customerId: customer?.id,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      shippingAddress: dto.shippingAddress ?? '',
      city: dto.city ?? '',
      deliveryFee,
      subtotal,
      discountAmount,
      couponCode: appliedCouponCode,
      grandTotal,
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentMethod === PaymentMethodEnum.COD ? PaymentStatusEnum.COD_PENDING : PaymentStatusEnum.UNPAID,
      orderStatus: store.autoConfirmOrders ? OrderStatusEnum.CONFIRMED : OrderStatusEnum.PENDING,
      storeSlug: dto.storeSlug,
      channel: normalizeChannel({
        requestedChannel: dto.channel,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        referrerHost: dto.referrerHost,
      }),
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
      referrerHost: dto.referrerHost,
      sessionId: dto.sessionId,
      tenantId,
      items: orderItems,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Record Customer 360 Activity
    if (customer?.id) {
      try {
        await this.recordCustomerActivityService.execute({
          tenantId,
          storeId: store.id,
          customerId: customer.id,
          eventType: 'ORDER_PLACED',
          title: `Placed Order #${savedOrder.orderNumber}`,
          description: `Order for ৳${Number(savedOrder.grandTotal).toLocaleString()} placed via ${savedOrder.paymentMethod}${isGuest ? ' (Guest Checkout)' : ''}`,
          actorName: dto.customerName || 'Customer',
          metadata: {
            orderId: savedOrder.id,
            orderNumber: savedOrder.orderNumber,
            grandTotal: Number(savedOrder.grandTotal),
            itemCount: savedOrder.items?.length || 1,
            paymentMethod: savedOrder.paymentMethod,
            paymentStatus: savedOrder.paymentStatus,
            isGuest,
          },
        });
      } catch (err) {
        // Non-blocking activity record
      }
    }

    // Close out any abandoned cart this customer left before checking out.
    await this.abandonedCartService.markRecoveredByPhone(tenantId, savedOrder.customerPhone);

    // Trigger Order Placement SMS
    try {
      await this.triggerOrderStatusSmsService.execute({
        orderId: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        customerPhone: savedOrder.customerPhone,
        customerName: savedOrder.customerName,
        storeName: store.name,
        grandTotal: Number(savedOrder.grandTotal),
        orderStatus: savedOrder.orderStatus,
        tenantId: savedOrder.tenantId,
      });
    } catch (err) {
      // Non-blocking SMS trigger
    }

    // Auto-convert matching open CRM leads to WON
    try {
      const rawPhone = dto.customerPhone?.replace(/\D/g, '').slice(-10);
      const rawEmail = dto.customerEmail?.trim().toLowerCase();

      const leads = await this.leadRepository.find({
        where: { tenantId },
      });

      for (const lead of leads) {
        const leadPhone = lead.phone?.replace(/\D/g, '').slice(-10);
        const leadEmail = lead.email?.trim().toLowerCase();

        const isPhoneMatch = Boolean(rawPhone && leadPhone && rawPhone === leadPhone);
        const isEmailMatch = Boolean(rawEmail && leadEmail && rawEmail === leadEmail);
        const isCustomerMatch = Boolean(customer?.id && lead.convertedCustomerId === customer.id);

        if (isPhoneMatch || isEmailMatch || isCustomerMatch) {
          if (lead.stage !== LeadStageEnum.WON) {
            lead.stage = LeadStageEnum.WON;
          }
          lead.estimatedValue = Number(savedOrder.grandTotal);
          lead.convertedCustomerId = customer?.id || lead.convertedCustomerId;
          lead.followUpStatus = 'COMPLETED';
          lead.nextFollowUpAt = null;
          lead.followUpNote = undefined;
          await this.leadRepository.save(lead);
        }
      }
    } catch (leadErr) {
      // Non-blocking lead conversion
    }

    return savedOrder;
  }

  private async rollbackStock(
    tenantId: string,
    deductedItems: { productId: string; quantity: number; variantId?: string }[],
  ): Promise<void> {
    for (const deducted of deductedItems) {
      try {
        await this.adjustStockService.execute(tenantId, {
          productId: deducted.productId,
          variantId: deducted.variantId,
          quantity: deducted.quantity,
          action: StockAdjustmentAction.ADD,
        });
      } catch (rollbackErr) {
        // Best-effort rollback; the original error is still surfaced to the caller.
      }
    }
  }
}
