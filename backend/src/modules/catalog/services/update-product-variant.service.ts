import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, DataSource } from 'typeorm';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../../inventory/entities/inventory-movement.entity';
import { MovementType } from '../../inventory/enums/inventory-movement-type.enum';
import { UpdateProductVariantDto } from '../dto/update-product-variant.dto';

@Injectable()
export class UpdateProductVariantService {
  constructor(
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(InventoryMovementEntity)
    private readonly movementRepository: Repository<InventoryMovementEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    productId: string,
    variantId: string,
    tenantId: string,
    dto: UpdateProductVariantDto,
  ): Promise<ProductVariantEntity> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, productId, tenantId },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found or access denied');
    }

    // SKU uniqueness validation
    if (dto.sku !== undefined) {
      const trimmedSku = dto.sku ? dto.sku.trim() : undefined;
      if (trimmedSku && trimmedSku !== variant.sku) {
        const existingSku = await this.variantRepository.findOne({
          where: { sku: trimmedSku, tenantId, id: Not(variantId) },
        });
        if (existingSku) {
          throw new BadRequestException('Variant SKU already exists.');
        }
      }
      variant.sku = trimmedSku;
    }

    // Barcode uniqueness validation
    if (dto.barcode !== undefined) {
      const trimmedBarcode = dto.barcode ? dto.barcode.trim() : undefined;
      if (trimmedBarcode && trimmedBarcode !== variant.barcode) {
        const existingBarcode = await this.variantRepository.findOne({
          where: { barcode: trimmedBarcode, tenantId, id: Not(variantId) },
        });
        if (existingBarcode) {
          throw new BadRequestException('Variant Barcode already exists.');
        }
      }
      variant.barcode = trimmedBarcode;
    }

    if (dto.price !== undefined) {
      variant.price = dto.price;
    }

    if (dto.compareAtPrice !== undefined) {
      variant.compareAtPrice = dto.compareAtPrice;
    }

    if (dto.costPrice !== undefined) {
      variant.costPrice = dto.costPrice;
    }

    if (dto.imageId !== undefined) {
      variant.imageId = dto.imageId || undefined;
    }

    if (dto.isEnabled !== undefined) {
      variant.isEnabled = Boolean(dto.isEnabled);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedVariant = await queryRunner.manager.save(ProductVariantEntity, variant);

      // Handle stock quantity adjustment if provided
      if (dto.stockQuantity !== undefined) {
        let stock = await queryRunner.manager.findOne(InventoryStockEntity, {
          where: { productId, variantId, tenantId },
        });

        if (!stock) {
          stock = queryRunner.manager.create(InventoryStockEntity, {
            productId,
            variantId,
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
            reason: 'Variant Stock Update',
            referenceType: 'VARIANT_EDIT',
            tenantId,
          });
          await queryRunner.manager.save(InventoryMovementEntity, movement);
        }
      }

      await queryRunner.commitTransaction();
      return savedVariant;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
