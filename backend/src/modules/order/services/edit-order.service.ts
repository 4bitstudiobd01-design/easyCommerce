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

    const oldItemsMap = new Map(order.items.map(i => [i.productId, i]));
    const restoredItems: OrderItemEntity[] = [];

    // 1. Rollback old inventory
    try {
      for (const oldItem of order.items) {
        await this.adjustStockService.execute(tenantId, {
          productId: oldItem.productId,
          quantity: oldItem.quantity,
          action: StockAdjustmentAction.ADD,
        });
        restoredItems.push(oldItem);
      }
    } catch (err) {
      // Revert the rollback partially if it fails midway
      for (const item of restoredItems) {
        await this.adjustStockService.execute(tenantId, {
          productId: item.productId,
          quantity: item.quantity,
          action: StockAdjustmentAction.REMOVE,
        });
      }
      throw new BadRequestException('Failed to release old inventory during edit.');
    }

    const newOrderItems: OrderItemEntity[] = [];
    const deductedItems: { productId: string; quantity: number }[] = [];
    const calculationInputItems = [];

    // 2. Validate and reserve new inventory
    try {
      for (const itemDto of dto.items) {
        const product = await this.productRepository.findOne({
          where: { id: itemDto.productId, tenantId },
          relations: ['variants'],
        });

        if (!product) {
          throw new NotFoundException(`Product with ID "${itemDto.productId}" not found.`);
        }

        const oldItem = oldItemsMap.get(itemDto.productId);
        // Retain old price if product existed, otherwise use current catalog price
        const unitPrice = oldItem ? Number(oldItem.unitPrice) : Number(product.basePrice);
        const totalPrice = unitPrice * itemDto.quantity;
        const sku = oldItem?.sku || product.variants?.[0]?.sku || `SKU-${product.id.slice(0, 6)}`;

        // Reserve new stock
        await this.adjustStockService.execute(tenantId, {
          productId: product.id,
          quantity: itemDto.quantity,
          action: StockAdjustmentAction.REMOVE,
        });
        deductedItems.push({ productId: product.id, quantity: itemDto.quantity });

        const newItem = new OrderItemEntity();
        newItem.productId = product.id;
        newItem.productTitle = product.title;
        newItem.sku = sku;
        newItem.unitPrice = unitPrice;
        newItem.quantity = itemDto.quantity;
        newItem.totalPrice = totalPrice;
        newItem.tenantId = tenantId;
        
        newOrderItems.push(newItem);
        calculationInputItems.push({ unitPrice, quantity: itemDto.quantity });
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
          productId: item.productId,
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
