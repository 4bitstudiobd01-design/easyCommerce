import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';
import { EditOrderDto } from '../dto/edit-order.dto';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { AdjustStockService } from '../../inventory/services/adjust-stock.service';
import { StockAdjustmentAction } from '../../inventory/dto/adjust-stock.dto';
import { OrderStateService } from './order-state.service';
import { OrderCalculationService } from './order-calculation.service';

@Injectable()
export class EditOrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly adjustStockService: AdjustStockService,
    private readonly orderStateService: OrderStateService,
    private readonly orderCalculationService: OrderCalculationService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(id: string, tenantId: string, userId: string, dto: EditOrderDto): Promise<OrderEntity> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    const order = await this.orderRepository.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found.`);
    }

    if (!this.orderStateService.isEditable(order.orderStatus)) {
      throw new BadRequestException(`Order cannot be edited in its current status: ${order.orderStatus}`);
    }

    // Best-effort match for "does this catalog item already exist on the order"
    // (price retention below), skipping custom items since they have no productId
    // — keyed by `productId::variantId` (not just id, and not just productId) so
    // multiple custom items (all productId: null) never collide, and two lines for
    // the same product but different variants are tracked as separate stock lines.
    const stockKey = (productId: string, variantId?: string | null) => `${productId}::${variantId ?? ''}`;

    const oldItemsByProductId = new Map(
      order.items
        .filter((i) => !i.isCustomItem && i.productId)
        .map((i) => [stockKey(i.productId as string, i.variantId), i]),
    );

    // Sum quantities per product+variant on the incoming list first, so a line that
    // appears more than once (or a duplicate of an existing line) is diffed as one
    // net change rather than as separate add/remove calls that could conflict.
    const newQuantityByProductId = new Map<string, number>();
    for (const itemDto of dto.items) {
      if (itemDto.isCustomItem || !itemDto.productId) continue;
      const key = stockKey(itemDto.productId, itemDto.variantId);
      newQuantityByProductId.set(key, (newQuantityByProductId.get(key) ?? 0) + itemDto.quantity);
    }

    const newOrderItems: OrderItemEntity[] = [];
    const calculationInputItems: { unitPrice: number; quantity: number; discountAmount?: number }[] = [];

    // 1. Build the new item entities (pricing/title/SKU) and validate every
    // referenced product exists BEFORE touching any stock, so an invalid
    // productId never leaves stock adjustments applied with nothing to roll them
    // back (a NotFoundException thrown after stock was already touched would).
    for (const itemDto of dto.items) {
      const newItem = new OrderItemEntity();
      newItem.tenantId = tenantId;
      newItem.quantity = itemDto.quantity;
      newItem.discountAmount = itemDto.discountAmount ?? 0;

      if (itemDto.isCustomItem) {
        // Custom/off-catalog line: no product lookup, no stock adjustment,
        // never persisted to the catalog.
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

      const oldItem = oldItemsByProductId.get(stockKey(product.id, itemDto.variantId));
      // Retain old price if this exact product+variant existed on the order before,
      // otherwise price from the selected variant (or the product default).
      const unitPrice = oldItem
        ? Number(oldItem.unitPrice)
        : variant
          ? Number(variant.price ?? product.basePrice)
          : Number(product.basePrice);
      const sku = oldItem?.sku || variant?.sku || product.variants?.[0]?.sku || `SKU-${product.id.slice(0, 6)}`;
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
    }

    // 2. Now that every item is validated, only touch stock for products whose
    // quantity actually changed between the old and new item lists (net delta),
    // instead of rolling back every old item and re-deducting every new one —
    // that used to fail an edit that didn't even touch a given product if its
    // stock happened to be tight at that instant.
    const appliedDeltas: { productId: string; variantId?: string; delta: number }[] = [];
    try {
      const touchedKeys = new Set([...oldItemsByProductId.keys(), ...newQuantityByProductId.keys()]);
      for (const key of touchedKeys) {
        const oldQty = oldItemsByProductId.get(key)?.quantity ?? 0;
        const newQty = newQuantityByProductId.get(key) ?? 0;
        const delta = newQty - oldQty;
        if (delta === 0) continue;

        const [productId, variantIdPart] = key.split('::');
        const variantId = variantIdPart || undefined;

        await this.adjustStockService.execute(tenantId, {
          productId,
          variantId,
          quantity: Math.abs(delta),
          // Needing more units than before deducts stock; needing fewer releases it.
          action: delta > 0 ? StockAdjustmentAction.REMOVE : StockAdjustmentAction.ADD,
        });
        appliedDeltas.push({ productId, variantId, delta });
      }
    } catch (err) {
      // Undo whichever deltas already succeeded before the failing one, restoring
      // the pristine pre-edit stock levels.
      for (const applied of appliedDeltas) {
        await this.adjustStockService.execute(tenantId, {
          productId: applied.productId,
          variantId: applied.variantId,
          quantity: Math.abs(applied.delta),
          action: applied.delta > 0 ? StockAdjustmentAction.ADD : StockAdjustmentAction.REMOVE,
        });
      }
      throw err;
    }

    // 3. Calculate new totals
    const totals = this.orderCalculationService.calculateTotals({
      items: calculationInputItems,
      deliveryFee: dto.deliveryFee,
      discountAmount: dto.discountAmount,
    });

    let savedOrder: OrderEntity;

    // Diff against the pre-edit snapshot before any field is overwritten, so the
    // audit trail shows exactly what a merchant changed instead of a generic
    // "Order edited" marker.
    const changeSummary = this.summarizeChanges(order, dto, totals, newOrderItems);

    // 4. Transactionally save everything
    await this.dataSource.transaction(async (manager) => {
      // Remove old items
      if (order.items.length > 0) {
        await manager.remove(order.items);
      }

      // Update order entity
      order.customerName = dto.customerName;
      order.customerPhone = dto.customerPhone;
      order.customerEmail = dto.customerEmail;
      order.shippingAddress = dto.shippingAddress;
      order.city = dto.city;
      order.area = dto.area;
      order.thana = dto.thana;
      order.district = dto.district;
      order.division = dto.division;
      order.customerNote = dto.customerNote;
      order.internalNote = dto.internalNote;
      order.deliveryFee = totals.deliveryFee;
      order.subtotal = totals.subtotal;
      order.discountAmount = totals.discountAmount;
      order.grandTotal = totals.grandTotal;
      order.items = newOrderItems;

      savedOrder = await manager.save(order);

      // Add audit history. previousStatus is deliberately left unset — that's how
      // the timeline distinguishes an edit marker from a real status transition.
      const history = manager.create(OrderStatusHistoryEntity, {
        orderId: order.id,
        newStatus: order.orderStatus, // Status did not change, just an edit marker
        changedBy: userId,
        reason: changeSummary || 'Order edited by merchant (no field changes detected)',
        tenantId,
      });

      await manager.save(history);
    });

    return savedOrder!;
  }

  /**
   * Builds a human-readable summary of what a merchant actually changed, for the
   * order timeline. Compares the pre-edit order (still holding its original field
   * values and items at this point) against the incoming DTO and the newly built
   * item list. Field labels only list old -> new when the value actually differs.
   */
  private summarizeChanges(
    order: OrderEntity,
    dto: EditOrderDto,
    totals: { deliveryFee: number; discountAmount: number },
    newItems: OrderItemEntity[],
  ): string {
    const changes: string[] = [];

    const compareField = (label: string, oldValue: unknown, newValue: unknown) => {
      const oldNormalized = oldValue ?? '';
      const newNormalized = newValue ?? '';
      if (String(oldNormalized) !== String(newNormalized)) {
        changes.push(`${label}: "${oldNormalized || '—'}" → "${newNormalized || '—'}"`);
      }
    };

    compareField('Customer name', order.customerName, dto.customerName);
    compareField('Phone', order.customerPhone, dto.customerPhone);
    compareField('Email', order.customerEmail, dto.customerEmail);
    compareField('Address', order.shippingAddress, dto.shippingAddress);
    compareField('City', order.city, dto.city);
    compareField('Area', order.area, dto.area);
    compareField('Thana', order.thana, dto.thana);
    compareField('District', order.district, dto.district);
    compareField('Division', order.division, dto.division);
    compareField('Customer note', order.customerNote, dto.customerNote);
    compareField('Internal note', order.internalNote, dto.internalNote);
    compareField('Delivery fee', Number(order.deliveryFee), totals.deliveryFee);
    compareField('Discount', Number(order.discountAmount), totals.discountAmount);

    const oldItemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const newItemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
    const oldItemKeys = order.items
      .map((i) => `${i.productId ?? i.productTitle}:${i.variantId ?? ''}:${i.quantity}`)
      .sort()
      .join(',');
    const newItemKeys = newItems
      .map((i) => `${i.productId ?? i.productTitle}:${i.variantId ?? ''}:${i.quantity}`)
      .sort()
      .join(',');

    if (oldItemKeys !== newItemKeys) {
      changes.push(`Items: ${order.items.length} line(s)/${oldItemCount} units → ${newItems.length} line(s)/${newItemCount} units`);
    }

    return changes.join('; ');
  }
}
