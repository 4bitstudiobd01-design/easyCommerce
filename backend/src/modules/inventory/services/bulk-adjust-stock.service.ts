import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import { InventoryDomainService } from './inventory-domain.service';
import { BulkAdjustStockDto } from '../dto/bulk-adjust-stock.dto';
import {
  BulkAdjustStockResponseDto,
  BulkAdjustStockItemResultDto,
} from '../dto/bulk-adjust-stock-response.dto';
import { MovementType } from '../enums/inventory-movement-type.enum';

@Injectable()
export class BulkAdjustStockService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventoryDomainService: InventoryDomainService,
  ) {}

  async execute(
    tenantId: string,
    dto: BulkAdjustStockDto,
    actorUserId?: string,
  ): Promise<BulkAdjustStockResponseDto> {
    // 1. Deduplicate incoming UUIDs
    const uniqueIds = Array.from(new Set(dto.inventoryIds || []));
    if (uniqueIds.length === 0) {
      throw new BadRequestException('At least one inventory item must be selected for bulk adjustment.');
    }

    if (uniqueIds.length > 100) {
      throw new BadRequestException('Maximum 100 inventory items can be adjusted in a single bulk operation.');
    }

    // 2. Validate quantity boundaries based on action
    if ((dto.action === 'ADD' || dto.action === 'REMOVE') && dto.quantity <= 0) {
      throw new BadRequestException(`Quantity must be greater than 0 for ${dto.action} operation.`);
    }

    if (dto.action === 'SET' && dto.quantity < 0) {
      throw new BadRequestException('Quantity cannot be negative for SET operation.');
    }

    // 3. Execute all-or-nothing database transaction with pessimistic locking
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Eagerly fetch and lock all target stock rows
      const stocks = await transactionalEntityManager
        .createQueryBuilder(InventoryStockEntity, 'stock')
        .setLock('pessimistic_write')
        .where('stock.id IN (:...ids)', { ids: uniqueIds })
        .andWhere('stock.tenantId = :tenantId', { tenantId })
        .getMany();

      // Verify all requested inventory records exist and belong to the authenticated tenant
      if (stocks.length !== uniqueIds.length) {
        const foundIds = new Set(stocks.map((s) => s.id));
        const missingIds = uniqueIds.filter((id) => !foundIds.has(id));
        throw new NotFoundException(
          `One or more selected inventory items were not found or access was denied: ${missingIds.slice(0, 3).join(', ')}${missingIds.length > 3 ? '...' : ''}`,
        );
      }

      // Populate product and variant relations safely
      const productIds = Array.from(new Set(stocks.map((s) => s.productId).filter(Boolean)));
      const variantIds = Array.from(new Set(stocks.map((s) => s.variantId).filter(Boolean)));

      const products = productIds.length > 0
        ? await transactionalEntityManager.find(ProductEntity, {
            where: { id: In(productIds), tenantId },
          })
        : [];
      const productMap = new Map(products.map((p) => [p.id, p]));

      const variants = variantIds.length > 0
        ? await transactionalEntityManager.find(ProductVariantEntity, {
            where: { id: In(variantIds), tenantId },
          })
        : [];
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      for (const stock of stocks) {
        if (stock.productId) stock.product = productMap.get(stock.productId);
        if (stock.variantId) stock.variant = variantMap.get(stock.variantId);
      }

      const itemResults: BulkAdjustStockItemResultDto[] = [];
      const movementsToInsert: InventoryMovementEntity[] = [];

      for (const stock of stocks) {
        const product = stock.product;
        const variant = stock.variant;
        const allowBackorder = product?.allowBackorder || false;
        const trackInventory = product ? product.trackInventory : true;
        const lowStockThreshold = stock.reorderPoint ?? product?.lowStockThreshold ?? 10;

        const previousQuantity = stock.quantityOnHand;

        // Compute new on-hand using canonical domain logic
        const newOnHand = this.inventoryDomainService.computeAdjustmentNewOnHand({
          currentOnHand: previousQuantity,
          adjustmentQuantity: dto.quantity,
          action: dto.action,
          allowBackorder,
        });

        const delta = newOnHand - previousQuantity;

        // Additional boundary check against active reserved stock
        const availableBefore = previousQuantity - stock.quantityReserved;
        if (!allowBackorder && delta < 0 && availableBefore + delta < 0) {
          const itemLabel = variant?.title
            ? `${product?.name || 'Product'} (${variant.title})`
            : product?.name || `Item ${stock.id}`;
          throw new BadRequestException(
            `Cannot reduce stock for "${itemLabel}". Available sellable stock is ${Math.max(0, availableBefore)}, but requested decrease is ${Math.abs(delta)}.`,
          );
        }

        // Apply new on-hand
        stock.quantityOnHand = newOnHand;
        await transactionalEntityManager.save(InventoryStockEntity, stock);

        // Recalculate metrics for response
        const newMetrics = this.inventoryDomainService.computeStockMetrics({
          onHand: newOnHand,
          reserved: stock.quantityReserved,
          lowStockThreshold,
          trackInventory,
          allowBackorder,
        });

        // Determine movement type
        let movementType = MovementType.ADJUSTMENT;
        if (delta > 0) {
          movementType = MovementType.IN;
        } else if (delta < 0) {
          movementType = MovementType.OUT;
        }

        // Build immutable movement ledger entity
        const movement = transactionalEntityManager.create(InventoryMovementEntity, {
          productId: stock.productId,
          variantId: stock.variantId,
          inventoryStockId: stock.id,
          type: movementType,
          quantity: delta,
          previousQuantity,
          newQuantity: newOnHand,
          reason: dto.reason?.trim() || `Bulk ${dto.action} Stock Adjustment`,
          note: dto.note?.trim() || undefined,
          referenceType: 'BULK_ADJUSTMENT',
          referenceId: dto.referenceId?.trim() || undefined,
          createdBy: actorUserId || 'SYSTEM_MERCHANT',
          tenantId,
        });

        const savedMovement = await transactionalEntityManager.save(InventoryMovementEntity, movement);

        itemResults.push({
          inventoryId: stock.id,
          productId: stock.productId,
          variantId: stock.variantId,
          previousQuantity,
          quantityDelta: delta,
          newQuantity: newOnHand,
          availableQuantity: newMetrics.available,
          status: newMetrics.status,
          movementId: savedMovement.id,
        });
      }

      return {
        success: true,
        affectedCount: itemResults.length,
        movementCount: itemResults.length,
        items: itemResults,
      };
    });
  }
}
