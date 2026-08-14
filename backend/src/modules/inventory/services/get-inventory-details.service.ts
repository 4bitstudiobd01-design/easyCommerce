import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryDomainService } from './inventory-domain.service';
import { InventoryDetailsResponseDto } from '../dto/inventory-details-response.dto';

@Injectable()
export class GetInventoryDetailsService {
  constructor(
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    private readonly inventoryDomainService: InventoryDomainService,
  ) {}

  async execute(tenantId: string, inventoryId: string): Promise<InventoryDetailsResponseDto> {
    const stock = await this.stockRepository.findOne({
      where: { id: inventoryId, tenantId },
      relations: [
        'product',
        'product.images',
        'product.category',
        'variant',
        'warehouse',
      ],
    });

    if (!stock) {
      throw new NotFoundException(`Inventory stock record with ID "${inventoryId}" not found or access denied.`);
    }

    const product = stock.product;
    const variant = stock.variant;
    const warehouse = stock.warehouse;

    const trackInventory = product ? product.trackInventory : true;
    const allowBackorder = product ? product.allowBackorder : false;
    const lowStockThreshold = stock.reorderPoint ?? product?.lowStockThreshold ?? 10;

    const metrics = this.inventoryDomainService.computeStockMetrics({
      onHand: stock.quantityOnHand,
      reserved: stock.quantityReserved,
      lowStockThreshold,
      trackInventory,
      allowBackorder,
    });

    // Resolve primary thumbnail with sortOrder fallback
    let productThumbnail: string | undefined = undefined;
    if (product && Array.isArray(product.images) && product.images.length > 0) {
      const sortedImages = [...product.images].sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
      productThumbnail = sortedImages[0]?.url;
    }

    return {
      id: stock.id,
      productId: stock.productId,
      product: {
        id: stock.productId,
        name: product?.name || 'Unknown Product',
        slug: product?.slug || '',
        thumbnail: productThumbnail,
        sku: product?.sku || undefined,
        productType: product?.productType || 'PHYSICAL',
        trackInventory,
        allowBackorder,
        category: product?.category
          ? {
              id: product.category.id,
              name: product.category.name,
              slug: product.category.slug,
            }
          : undefined,
      },
      variant: variant
        ? {
            id: variant.id,
            title: variant.title,
            sku: variant.sku || undefined,
            price: variant.price ? Number(variant.price) : undefined,
            combinationKey: variant.combinationKey || undefined,
          }
        : undefined,
      warehouse: {
        id: stock.warehouseId,
        name: warehouse?.name || 'Default Warehouse',
        code: warehouse?.code || 'DEFAULT',
        address: warehouse?.address || undefined,
        phone: warehouse?.phone || undefined,
        isDefault: warehouse ? warehouse.isDefault : true,
      },
      quantityOnHand: metrics.onHand,
      quantityReserved: metrics.reserved,
      availableQuantity: metrics.available,
      lowStockThreshold,
      trackInventory,
      allowBackorder,
      status: metrics.status,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    };
  }
}
