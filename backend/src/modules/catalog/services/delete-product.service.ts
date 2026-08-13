import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';
import { ProductStatus } from '../enums/product-status.enum';

export interface DeleteProductResult {
  message: string;
  archived: boolean;
}

@Injectable()
export class DeleteProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Removes a product from the catalog.
   *
   * order_items stores productId WITHOUT a foreign key, so a hard delete would leave
   * order lines pointing at a row that no longer exists — silently corrupting historical
   * revenue, units sold and variant analytics. A product that has ever been ordered is
   * therefore archived instead of deleted, which hides it from the storefront while
   * keeping order history and its reporting intact.
   *
   * Products that were never ordered are deleted for real; their images, variants,
   * stock, relations and reviews cascade away at the database level.
   */
  async execute(productId: string, tenantId: string): Promise<DeleteProductResult> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const orderedCount = await this.orderItemRepository.count({
      where: { productId, tenantId },
    });

    if (orderedCount > 0) {
      if (product.status === ProductStatus.ARCHIVED) {
        throw new ConflictException(
          'This product appears in existing orders and is already archived, so it cannot be deleted.',
        );
      }

      product.status = ProductStatus.ARCHIVED;
      product.isPublished = false;
      await this.productRepository.save(product);

      return {
        message: `"${product.name}" appears in ${orderedCount} order item(s), so it was archived instead of deleted to preserve order history.`,
        archived: true,
      };
    }

    // Rows in inventory_movements reference the product but are not cascaded, so they
    // are cleared explicitly inside the same transaction as the product delete.
    await this.dataSource.transaction(async (manager) => {
      await manager.query('DELETE FROM inventory_movements WHERE "productId" = $1 AND "tenantId" = $2', [
        productId,
        tenantId,
      ]);
      await manager.delete(ProductEntity, { id: productId, tenantId });
    });

    return {
      message: `"${product.name}" was deleted successfully.`,
      archived: false,
    };
  }
}
