import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum, PaymentMethodEnum } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';
import { CreateManualOrderDto } from '../dto/create-manual-order.dto';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { AdjustStockService } from '../../inventory/services/adjust-stock.service';
import { StockAdjustmentAction } from '../../inventory/dto/adjust-stock.dto';
import { ApplyCouponService } from '../../coupon/services/apply-coupon.service';
import { FindOrCreateCustomerService } from '../../customer/services/find-or-create-customer.service';
import { CustomerSourceEnum } from '../../customer/entities/customer.entity';
import { LeadEntity, LeadStageEnum } from '../../customer/entities/lead.entity';
import { GenerateOrderNumberService } from './generate-order-number.service';
import { OrderCalculationService } from './order-calculation.service';
import { StoreEntity } from '../../tenant/entities/store.entity';

/**
 * Merchant-initiated order creation (phone orders, walk-ins, manual entries) —
 * distinct from CreateOrderService, which is the public storefront checkout
 * path. Mirrors EditOrderService's item-handling: every referenced product is
 * validated and priced BEFORE any stock is touched, and custom/off-catalog
 * lines with per-line discounts are supported, which the storefront path
 * does not need. Reuses OrderCalculationService for totals so this order's
 * math can never drift from what EditOrderService computes later.
 */
@Injectable()
export class CreateManualOrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly adjustStockService: AdjustStockService,
    private readonly applyCouponService: ApplyCouponService,
    private readonly findOrCreateCustomerService: FindOrCreateCustomerService,
    private readonly generateOrderNumberService: GenerateOrderNumberService,
    private readonly orderCalculationService: OrderCalculationService,
  ) {}

  async execute(tenantId: string, userId: string, store: StoreEntity, dto: CreateManualOrderDto): Promise<OrderEntity> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    // 1. Build item entities and validate every referenced product exists
    // BEFORE touching stock — an invalid productId must never leave a
    // partially-deducted order behind.
    const newOrderItems: OrderItemEntity[] = [];
    const calculationInputItems: { unitPrice: number; quantity: number; discountAmount?: number }[] = [];
    // Keyed by `${productId}::${variantId ?? ''}` so two lines for the same product
    // but different variants deduct stock separately instead of merging.
    const stockNeeded = new Map<string, { productId: string; variantId?: string; quantity: number }>();

    for (const itemDto of dto.items) {
      const newItem = new OrderItemEntity();
      newItem.tenantId = tenantId;
      newItem.quantity = itemDto.quantity;
      newItem.discountAmount = itemDto.discountAmount ?? 0;

      if (itemDto.isCustomItem) {
        const unitPrice = Number(itemDto.customUnitPrice);
        newItem.productId = null;
        newItem.isCustomItem = true;
        newItem.productTitle = itemDto.customTitle as string;
        newItem.productImageUrl = null;
        newItem.unitPrice = unitPrice;
        newItem.totalPrice = unitPrice * itemDto.quantity - newItem.discountAmount;

        newOrderItems.push(newItem);
        calculationInputItems.push({ unitPrice, quantity: itemDto.quantity, discountAmount: newItem.discountAmount });
        continue;
      }

      const product = await this.productRepository.findOne({
        where: { id: itemDto.productId, tenantId },
        relations: ['variants', 'images'],
      });

      if (!product) {
        throw new NotFoundException(`Product with ID "${itemDto.productId}" not found.`);
      }

      // Resolve and validate the selected variant, when provided — falls back to
      // today's product-level pricing/SKU when no variantId is sent.
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
      const sku = variant?.sku || product.variants?.[0]?.sku || `SKU-${product.id.slice(0, 6)}`;
      const primaryImage = product.images?.find((image) => image.isPrimary) ?? product.images?.[0];

      newItem.productId = product.id;
      newItem.variantId = variant?.id;
      newItem.variantTitle = variant?.title;
      newItem.isCustomItem = false;
      newItem.productTitle = product.title;
      newItem.sku = sku;
      newItem.productImageUrl = variant?.image?.url ?? primaryImage?.url ?? null;
      newItem.unitPrice = unitPrice;
      newItem.totalPrice = unitPrice * itemDto.quantity - newItem.discountAmount;

      newOrderItems.push(newItem);
      calculationInputItems.push({ unitPrice, quantity: itemDto.quantity, discountAmount: newItem.discountAmount });

      const stockKey = `${product.id}::${variant?.id ?? ''}`;
      const existing = stockNeeded.get(stockKey);
      stockNeeded.set(stockKey, {
        productId: product.id,
        variantId: variant?.id,
        quantity: (existing?.quantity ?? 0) + itemDto.quantity,
      });
    }

    // 2. Now that every item is validated, deduct stock — rolling back
    // whatever already succeeded if a later product runs out.
    const deductedItems: { productId: string; quantity: number; variantId?: string }[] = [];
    try {
      for (const need of stockNeeded.values()) {
        await this.adjustStockService.execute(tenantId, {
          productId: need.productId,
          variantId: need.variantId,
          quantity: need.quantity,
          action: StockAdjustmentAction.REMOVE,
        });
        deductedItems.push(need);
      }
    } catch (err) {
      await this.rollbackStock(tenantId, deductedItems);
      throw err;
    }

    // 3. Coupon (optional) — re-validated and atomically incremented server-side,
    // same as the storefront checkout path; never trust a client-supplied discount.
    let couponDiscount = 0;
    let appliedCouponCode: string | undefined;
    if (dto.couponCode) {
      try {
        const preDiscountSubtotal = this.orderCalculationService.calculateTotals({
          items: calculationInputItems,
          deliveryFee: 0,
          discountAmount: 0,
        }).subtotal;
        const applied = await this.applyCouponService.execute(tenantId, dto.couponCode, preDiscountSubtotal);
        couponDiscount = applied.discountAmount;
        appliedCouponCode = applied.code;
      } catch (err) {
        await this.rollbackStock(tenantId, deductedItems);
        throw err;
      }
    }

    // 4. Totals — the order-wide discountAmount from the DTO (a merchant-entered
    // manual discount) is combined with any coupon discount.
    let totals;
    try {
      totals = this.orderCalculationService.calculateTotals({
        items: calculationInputItems,
        deliveryFee: dto.deliveryFee,
        discountAmount: dto.discountAmount + couponDiscount,
      });
    } catch (err) {
      await this.rollbackStock(tenantId, deductedItems);
      throw err;
    }

    // 5. Order number + customer resolution + save, all inside a transaction.
    let orderNumber: string;
    try {
      orderNumber = await this.dataSource.transaction((manager) =>
        this.generateOrderNumberService.execute(manager, tenantId),
      );
    } catch (err) {
      await this.rollbackStock(tenantId, deductedItems);
      throw err;
    }

    const customer = await this.findOrCreateCustomerService.execute(tenantId, {
      phone: dto.customerPhone,
      name: dto.customerName,
      email: dto.customerEmail,
      storeId: store.id,
      source: CustomerSourceEnum.MANUAL,
    });

    const order = this.orderRepository.create({
      orderNumber,
      customerId: customer?.id,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      shippingAddress: dto.shippingAddress,
      city: dto.city,
      area: dto.area,
      thana: dto.thana,
      district: dto.district,
      division: dto.division,
      customerNote: dto.customerNote,
      internalNote: dto.internalNote,
      deliveryFee: totals.deliveryFee,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      couponCode: appliedCouponCode,
      grandTotal: totals.grandTotal,
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentMethod === PaymentMethodEnum.COD ? PaymentStatusEnum.COD_PENDING : PaymentStatusEnum.UNPAID,
      orderStatus: OrderStatusEnum.PENDING,
      storeSlug: store.slug,
      channel: 'manual',
      tenantId,
      items: newOrderItems,
    });

    let savedOrder: OrderEntity;
    await this.dataSource.transaction(async (manager) => {
      savedOrder = await manager.save(order);

      const history = manager.create(OrderStatusHistoryEntity, {
        orderId: savedOrder.id,
        newStatus: savedOrder.orderStatus,
        changedBy: userId,
        reason: 'Order created manually by merchant',
        tenantId,
      });
      await manager.save(history);
    });

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
          lead.estimatedValue = Number(savedOrder!.grandTotal);
          lead.convertedCustomerId = customer?.id || lead.convertedCustomerId;
          lead.followUpStatus = 'COMPLETED';
          lead.nextFollowUpAt = null;
          lead.followUpNote = undefined;
          await this.leadRepository.save(lead);
        }
      }
    } catch {
      // Non-blocking lead conversion
    }

    return savedOrder!;
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
      } catch {
        // Best-effort rollback; the original error is still surfaced to the caller.
      }
    }
  }
}
