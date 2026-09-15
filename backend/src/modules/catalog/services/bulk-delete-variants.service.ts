import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { ProductEntity } from '../entities/product.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';

@Injectable()
export class BulkDeleteVariantsService {
  constructor(
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Deletes several variants of one product in a single transaction so a failure
   * partway through cannot leave half the selection removed (the old client-side
   * loop deleted them one request at a time). Every id must belong to this product
   * and tenant or the whole call is rejected.
   */
  async execute(
    productId: string,
    tenantId: string,
    variantIds: string[],
  ): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });
    if (!product) {
      throw new NotFoundException('Product not found or access denied');
    }

    const variants = await this.variantRepository.find({
      where: { id: In(variantIds), productId, tenantId },
    });

    if (variants.length !== variantIds.length) {
      throw new NotFoundException('One or more variants were not found on this product');
    }

    const foundIds = variants.map((v) => v.id);

    await this.dataSource.transaction(async (manager) => {
      // Variant stock rows are referenced by id, not an FK cascade, so clear them
      // explicitly the same way a single delete leaves no orphan stock behind.
      await manager.delete(InventoryStockEntity, { variantId: In(foundIds), tenantId });
      await manager.delete(ProductVariantEntity, { id: In(foundIds), productId, tenantId });

      const remaining = await manager.count(ProductVariantEntity, {
        where: { productId, tenantId },
      });
      if (remaining === 0) {
        await manager.update(ProductEntity, { id: productId, tenantId }, { hasVariants: false });
      }
    });

    return {
      success: true,
      deletedCount: foundIds.length,
      message: `${foundIds.length} variant${foundIds.length === 1 ? '' : 's'} deleted successfully`,
    };
  }
}
