import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../../inventory/entities/inventory-movement.entity';
import { MovementType } from '../../inventory/enums/inventory-movement-type.enum';
import { BulkUpdateVariantsDto } from '../dto/bulk-update-variants.dto';

@Injectable()
export class BulkUpdateVariantsService {
  constructor(
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(InventoryMovementEntity)
    private readonly movementRepository: Repository<InventoryMovementEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(productId: string, tenantId: string, dto: BulkUpdateVariantsDto): Promise<ProductVariantEntity[]> {
    if (!dto.variantIds || dto.variantIds.length === 0) {
      throw new BadRequestException('No variants selected for bulk updating');
    }

    const variants = await this.variantRepository.find({
      where: { id: In(dto.variantIds), productId, tenantId },
    });

    if (variants.length === 0) {
      throw new NotFoundException('Selected variants not found or access denied');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedVariants: ProductVariantEntity[] = [];

      for (const variant of variants) {
        if (dto.price !== undefined) {
          variant.price = dto.price;
        }

        if (dto.compareAtPrice !== undefined) {
          variant.compareAtPrice = dto.compareAtPrice;
        }

        if (dto.costPrice !== undefined) {
          variant.costPrice = dto.costPrice;
        }

        if (dto.isEnabled !== undefined) {
          variant.isEnabled = Boolean(dto.isEnabled);
        }

        const savedVariant = await queryRunner.manager.save(ProductVariantEntity, variant);

        if (dto.stockQuantity !== undefined) {
          let stock = await queryRunner.manager.findOne(InventoryStockEntity, {
            where: { productId, variantId: variant.id, tenantId },
          });

          if (!stock) {
            stock = queryRunner.manager.create(InventoryStockEntity, {
              productId,
              variantId: variant.id,
              quantityOnHand: 0,
              quantityReserved: 0,
              tenantId,
            });
          }

          const prevQty = stock.quantityOnHand;
          const newQty = Math.max(0, dto.stockQuantity);
          stock.quantityOnHand = newQty;
          const savedStock = await queryRunner.manager.save(InventoryStockEntity, stock);

          if (newQty !== prevQty) {
            const movement = queryRunner.manager.create(InventoryMovementEntity, {
              productId,
              inventoryStockId: savedStock.id,
              type: newQty >= prevQty ? MovementType.IN : MovementType.OUT,
              quantity: newQty - prevQty,
              previousQuantity: prevQty,
              newQuantity: newQty,
              reason: 'Bulk Variant Stock Adjustment',
              referenceType: 'BULK_VARIANT_EDIT',
              tenantId,
            });
            await queryRunner.manager.save(InventoryMovementEntity, movement);
          }
        }

        updatedVariants.push(savedVariant);
      }

      await queryRunner.commitTransaction();
      return updatedVariants;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
