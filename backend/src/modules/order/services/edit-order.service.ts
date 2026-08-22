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
    // — keying by productId directly here (not id) would collide for multiple
    // custom items, which all carry productId: null.
    const oldItemsByProductId = new Map(
      order.items.filter((i) => !i.isCustomItem && i.productId).map((i) => [i.productId as string, i]),
    );
    const restoredItems: OrderItemEntity[] = [];

    // 1. Rollback old inventory (catalog items only — custom items were never stock-tracked)
    try {
      for (const oldItem of order.items) {
        if (oldItem.isCustomItem) {
          continue;
        }
        await this.adjustStockService.execute(tenantId, {
          productId: oldItem.productId as string,
          quantity: oldItem.quantity,
          action: StockAdjustmentAction.ADD,
        });
        restoredItems.push(oldItem);
      }
    } catch (err) {
      // Revert the rollback partially if it fails midway
      for (const item of restoredItems) {
        await this.adjustStockService.execute(tenantId, {
          productId: item.productId as string,
          quantity: item.quantity,
          action: StockAdjustmentAction.REMOVE,
        });
      }
      throw new BadRequestException('Failed to release old inventory during edit.');
    }

    const newOrderItems: OrderItemEntity[] = [];
    const deductedItems: { productId: string; quantity: number }[] = [];
    const calculationInputItems: { unitPrice: number; quantity: number; discountAmount?: number }[] = [];

    // 2. Validate and reserve new inventory
    try {
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

        const oldItem = oldItemsByProductId.get(product.id);
        // Retain old price if product existed on the order before, otherwise use current catalog price
        const unitPrice = oldItem ? Number(oldItem.unitPrice) : Number(product.basePrice);
        const sku = oldItem?.sku || product.variants?.[0]?.sku || `SKU-${product.id.slice(0, 6)}`;
        const primaryImage = product.images?.find((image) => image.isPrimary) ?? product.images?.[0];

        // Reserve new stock
        await this.adjustStockService.execute(tenantId, {
          productId: product.id,
          quantity: itemDto.quantity,
          action: StockAdjustmentAction.REMOVE,
        });
        deductedItems.push({ productId: product.id, quantity: itemDto.quantity });

        newItem.productId = product.id;
        newItem.isCustomItem = false;
        newItem.productTitle = product.title;
        newItem.sku = sku;
        newItem.productImageUrl = primaryImage?.url ?? null;
        newItem.unitPrice = unitPrice;
        newItem.totalPrice = unitPrice * itemDto.quantity - newItem.discountAmount;

        newOrderItems.push(newItem);
        calculationInputItems.push({ unitPrice, quantity: itemDto.quantity, discountAmount: newItem.discountAmount });
      }
    } catch (err) {
      // Rollback the newly deducted items
      for (const deducted of deductedItems) {
        await this.adjustStockService.execute(tenantId, {
          productId: deducted.productId,
          quantity: deducted.quantity,
          action: StockAdjustmentAction.ADD,
        });
      }
      // Re-deduct original items to restore pristine original state
      for (const item of restoredItems) {
        await this.adjustStockService.execute(tenantId, {
          productId: item.productId as string,
          quantity: item.quantity,
          action: StockAdjustmentAction.REMOVE,
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

      // Add audit history
      const history = manager.create(OrderStatusHistoryEntity, {
        orderId: order.id,
        newStatus: order.orderStatus, // Status did not change, just an edit marker
        changedBy: userId,
        reason: 'Order edited by merchant',
        tenantId,
      });

      await manager.save(history);
    });

    return savedOrder!;
  }
}
