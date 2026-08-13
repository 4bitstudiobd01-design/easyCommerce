import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { AdjustStockDto, StockAdjustmentAction } from '../dto/adjust-stock.dto';
import { MovementType } from '../enums/inventory-movement-type.enum';
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
    private readonly listWarehousesService: ListWarehousesService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(tenantId: string, dto: AdjustStockDto): Promise<InventoryStockEntity> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found or access denied');
    }

    let warehouseId = dto.warehouseId;
    if (!warehouseId) {
      const warehouses = await this.listWarehousesService.execute(tenantId);
      warehouseId = warehouses[0].id;
    }

    const qty = Number(dto.quantity);
    if (isNaN(qty) || qty < 0) {
      throw new BadRequestException('Adjustment quantity must be a non-negative number');
    }

    // Execute atomic stock adjustment and movement logging within transaction runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let stock = await queryRunner.manager.findOne(InventoryStockEntity, {
        where: { productId: dto.productId, warehouseId, tenantId },
      });

      if (!stock) {
        stock = queryRunner.manager.create(InventoryStockEntity, {
          productId: dto.productId,
          warehouseId,
          quantityOnHand: 0,
          quantityReserved: 0,
          reorderPoint: product.lowStockThreshold || 10,
          tenantId,
        });
      }

      const previousQty = stock.quantityOnHand;
      let newQty = previousQty;
      let movementType = MovementType.ADJUSTMENT;

      switch (dto.action) {
        case StockAdjustmentAction.ADD:
          newQty = previousQty + qty;
          movementType = MovementType.IN;
          break;
        case StockAdjustmentAction.SET:
          newQty = qty;
          movementType = qty >= previousQty ? MovementType.IN : MovementType.OUT;
          break;
        case StockAdjustmentAction.REMOVE:
          if (!product.allowBackorder && previousQty - qty < 0) {
            throw new BadRequestException(
              `Insufficient stock for product ${dto.productId}: ${previousQty} on hand, ${qty} requested to remove.`,
            );
          }
          newQty = Math.max(0, previousQty - qty);
          movementType = MovementType.OUT;
          break;
        default:
          throw new BadRequestException(`Invalid adjustment action: ${dto.action}`);
      }

      stock.quantityOnHand = newQty;
      const savedStock = await queryRunner.manager.save(InventoryStockEntity, stock);

      // Create immutable movement audit log
      const movement = queryRunner.manager.create(InventoryMovementEntity, {
        productId: dto.productId,
        inventoryStockId: savedStock.id,
        type: movementType,
        quantity: newQty - previousQty,
        previousQuantity: previousQty,
        newQuantity: newQty,
        reason: dto.reason || 'Manual Adjustment',
        referenceType: 'MANUAL_ADJUSTMENT',
        tenantId,
      });

      await queryRunner.manager.save(InventoryMovementEntity, movement);
      await queryRunner.commitTransaction();

      return savedStock;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
