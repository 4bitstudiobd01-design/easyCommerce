import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { AdjustStockDto, StockAdjustmentAction } from '../dto/adjust-stock.dto';
import { StockAdjustmentResponseDto } from '../dto/stock-adjustment-response.dto';
import { MovementType } from '../enums/inventory-movement-type.enum';
import { InventoryDomainService } from './inventory-domain.service';
import { ListWarehousesService } from './list-warehouses.service';

@Injectable()
export class AdjustStockService {
  constructor(
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(InventoryMovementEntity)
    private readonly movementRepository: Repository<InventoryMovementEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
    private readonly inventoryDomainService: InventoryDomainService,
    private readonly listWarehousesService: ListWarehousesService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tenantId: string,
    dto: AdjustStockDto,
    userId?: string,
  ): Promise<StockAdjustmentResponseDto> {
    const qty = Number(dto.quantity);
    if (isNaN(qty) || qty < 0) {
      throw new BadRequestException('Adjustment quantity must be a non-negative number.');
    }

    if ((dto.action === StockAdjustmentAction.ADD || dto.action === StockAdjustmentAction.REMOVE) && qty === 0) {
      throw new BadRequestException('Adjustment quantity for ADD and REMOVE actions must be greater than zero.');
    }

    if (dto.reason !== undefined && dto.reason.trim() === '') {
      throw new BadRequestException('Adjustment reason cannot be blank.');
    }

    const adjustmentReason = dto.reason?.trim() || 'Manual Adjustment';



    // Connect query runner and begin atomic database transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let stock: InventoryStockEntity | null = null;

      // 1. Locate stock either by inventoryId or by productId + warehouseId
      if (dto.inventoryId) {
        stock = await queryRunner.manager.findOne(InventoryStockEntity, {
          where: { id: dto.inventoryId, tenantId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!stock) {
          throw new NotFoundException(`Inventory stock record "${dto.inventoryId}" not found or access denied.`);
        }

        if (stock.productId) {
          stock.product =
            (await queryRunner.manager.findOne(ProductEntity, {
              where: { id: stock.productId, tenantId },
            })) || undefined;
        }
      } else if (dto.productId) {
        let warehouseId = dto.warehouseId;
        if (!warehouseId) {
          const warehouses = await this.listWarehousesService.execute(tenantId);
          if (!warehouses || warehouses.length === 0) {
            throw new BadRequestException('No warehouse configured for this store.');
          }
          warehouseId = warehouses[0].id;
        }

        stock = await queryRunner.manager.findOne(InventoryStockEntity, {
          where: {
            productId: dto.productId,
            warehouseId,
            tenantId,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (stock) {
          stock.product =
            (await queryRunner.manager.findOne(ProductEntity, {
              where: { id: dto.productId, tenantId },
            })) || undefined;
        } else {
          const product = await this.productRepository.findOne({
            where: { id: dto.productId, tenantId },
          });

          if (!product) {
            throw new NotFoundException(`Product with ID "${dto.productId}" not found or access denied.`);
          }

          stock = queryRunner.manager.create(InventoryStockEntity, {
            productId: dto.productId,
            variantId: dto.variantId,
            warehouseId,
            quantityOnHand: 0,
            quantityReserved: 0,
            reorderPoint: product.lowStockThreshold || 10,
            tenantId,
          });
          stock.product = product;
        }
      } else {
        throw new BadRequestException('Either inventoryId or productId must be provided.');
      }

      const product = stock.product;
      const allowBackorder = product ? product.allowBackorder : false;
      const trackInventory = product ? product.trackInventory : true;
      const lowStockThreshold = stock.reorderPoint ?? product?.lowStockThreshold ?? 10;

      const beforeOnHand = stock.quantityOnHand;
      const beforeReserved = stock.quantityReserved;
      const beforeAvailable = this.inventoryDomainService.calculateAvailableStock(
        beforeOnHand,
        beforeReserved,
        allowBackorder,
      );

      let newOnHand = beforeOnHand;
      let movementType = MovementType.ADJUSTMENT;
      let delta = 0;

      switch (dto.action) {
        case StockAdjustmentAction.ADD:
          newOnHand = beforeOnHand + qty;
          delta = qty;
          movementType = MovementType.IN;
          break;

        case StockAdjustmentAction.REMOVE:
          if (!allowBackorder && beforeOnHand - qty < beforeReserved) {
            throw new BadRequestException(
              `Cannot remove ${qty} units. Only ${Math.max(0, beforeOnHand - beforeReserved)} units are available to remove (${beforeReserved} units are reserved for pending orders).`,
            );
          }
          newOnHand = allowBackorder ? beforeOnHand - qty : Math.max(0, beforeOnHand - qty);
          delta = -qty;
          movementType = MovementType.OUT;
          break;

        case StockAdjustmentAction.SET:
          if (!allowBackorder && qty < beforeReserved) {
            throw new BadRequestException(
              `Cannot set stock to ${qty} units because ${beforeReserved} units are already reserved for pending orders. Minimum allowed stock count is ${beforeReserved}.`,
            );
          }
          newOnHand = qty;
          delta = newOnHand - beforeOnHand;
          movementType = delta >= 0 ? MovementType.IN : MovementType.OUT;
          break;

        default:
          throw new BadRequestException(`Invalid adjustment action: ${dto.action}`);
      }

      if (!allowBackorder && newOnHand < 0) {
        throw new BadRequestException('Resulting on-hand stock cannot be negative.');
      }

      // Persist stock mutation
      stock.quantityOnHand = newOnHand;
      const savedStock = await queryRunner.manager.save(InventoryStockEntity, stock);

      // Create immutable audit movement
      const movement = queryRunner.manager.create(InventoryMovementEntity, {
        productId: savedStock.productId,
        variantId: savedStock.variantId,
        inventoryStockId: savedStock.id,
        type: movementType,
        quantity: delta,
        previousQuantity: beforeOnHand,
        newQuantity: newOnHand,
        reason: adjustmentReason,
        referenceType: 'MANUAL_ADJUSTMENT',
        referenceId: dto.reference?.trim() || undefined,
        note: dto.notes?.trim() || undefined,
        createdBy: userId || undefined,
        tenantId,

      });

      const savedMovement = await queryRunner.manager.save(InventoryMovementEntity, movement);
      await queryRunner.commitTransaction();

      const afterAvailable = this.inventoryDomainService.calculateAvailableStock(
        newOnHand,
        savedStock.quantityReserved,
        allowBackorder,
      );

      const status = this.inventoryDomainService.calculateStockStatus(
        afterAvailable,
        lowStockThreshold,
        trackInventory,
      );

      return {
        id: savedStock.id,
        productId: savedStock.productId,
        variantId: savedStock.variantId,
        warehouseId: savedStock.warehouseId,
        before: {
          onHand: beforeOnHand,
          reserved: beforeReserved,
          available: beforeAvailable,
        },
        after: {
          onHand: newOnHand,
          reserved: savedStock.quantityReserved,
          available: afterAvailable,
        },
        delta,
        status,
        movement: {
          id: savedMovement.id,
          type: savedMovement.type,
          quantity: savedMovement.quantity,
          previousQuantity: savedMovement.previousQuantity,
          newQuantity: savedMovement.newQuantity,
          reason: savedMovement.reason,
          referenceId: savedMovement.referenceId,
          note: savedMovement.note,
          createdBy: savedMovement.createdBy,
          createdAt: savedMovement.createdAt,
        },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
