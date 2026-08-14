import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryDomainService } from './inventory-domain.service';
import { ListInventoryQueryDto, InventorySortField } from '../dto/list-inventory-query.dto';
import {
  InventoryListItemDto,
  InventoryListResponseDto,
} from '../dto/inventory-list-response.dto';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

@Injectable()
export class ListInventoryService {
  constructor(
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    private readonly inventoryDomainService: InventoryDomainService,
  ) {}

  async execute(
    tenantId: string,
    queryDto: ListInventoryQueryDto,
  ): Promise<InventoryListResponseDto> {
    const page = Math.max(1, Number(queryDto.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryDto.limit) || 10));
    const skip = (page - 1) * limit;

    const qb = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('stock.variant', 'variant')
      .leftJoinAndSelect('stock.warehouse', 'warehouse')
      .where('stock.tenantId = :tenantId', { tenantId });

    // Server-side Search across Product Name, Product SKU, Variant SKU, and Variant Title
    if (queryDto.search && queryDto.search.trim() !== '') {
      const searchTerm = `%${queryDto.search.trim()}%`;
      qb.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR variant.sku ILIKE :search OR variant.title ILIKE :search)',
        { search: searchTerm },
      );
    }

    // Category Filter
    if (queryDto.categoryId && queryDto.categoryId.trim() !== '' && queryDto.categoryId !== 'all') {
      qb.andWhere('product.categoryId = :categoryId', { categoryId: queryDto.categoryId });
    }

    // Product Type Filter
    if (queryDto.productType) {
      qb.andWhere('product.productType = :productType', { productType: queryDto.productType });
    }

    // Warehouse Filter
    if (queryDto.warehouseId && queryDto.warehouseId.trim() !== '' && queryDto.warehouseId !== 'all') {
      qb.andWhere('stock.warehouseId = :warehouseId', { warehouseId: queryDto.warehouseId });
    }

    // Canonical Status / Stock Level Filter
    if (queryDto.status && queryDto.status !== ('ALL' as any)) {
      const availableExpr = `(stock."quantityOnHand" - stock."quantityReserved")`;
      const thresholdExpr = `COALESCE(stock."reorderPoint", product."lowStockThreshold", 10)`;

      if (queryDto.status === StockStatus.NOT_TRACKED) {
        qb.andWhere('product.trackInventory = false');
      } else if (queryDto.status === StockStatus.OUT_OF_STOCK) {
        qb.andWhere('product.trackInventory = true').andWhere(`${availableExpr} <= 0`);
      } else if (queryDto.status === StockStatus.LOW_STOCK) {
        qb.andWhere('product.trackInventory = true')
          .andWhere(`${availableExpr} > 0`)
          .andWhere(`${availableExpr} <= ${thresholdExpr}`);
      } else if (queryDto.status === StockStatus.IN_STOCK) {
        qb.andWhere('product.trackInventory = true')
          .andWhere(`${availableExpr} > ${thresholdExpr}`);
      }
    }


    // Server-side Sorting
    const sortOrder = queryDto.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    switch (queryDto.sortBy) {
      case InventorySortField.ON_HAND:
        qb.orderBy('stock.quantityOnHand', sortOrder);
        break;
      case InventorySortField.AVAILABLE:
        qb.orderBy('(stock.quantityOnHand - stock.quantityReserved)', sortOrder);
        break;
      case InventorySortField.NAME:
        qb.orderBy('product.name', sortOrder);
        break;
      case InventorySortField.SKU:
        qb.orderBy('COALESCE(variant.sku, product.sku)', sortOrder);
        break;
      case InventorySortField.UPDATED_AT:
      default:
        qb.orderBy('stock.updatedAt', sortOrder);
        break;
    }
    qb.addOrderBy('stock.id', 'ASC');

    // Server-side pagination
    qb.skip(skip).take(limit);

    const [rawStocks, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 0;

    const data: InventoryListItemDto[] = rawStocks.map((stock) => {
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

      // Resolve primary image thumbnail with fallback
      let productThumbnail: string | undefined = undefined;
      if (product && Array.isArray(product.images) && product.images.length > 0) {
        const sortedImages = [...product.images].sort(
          (a, b) =>
            Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        );
        productThumbnail = sortedImages[0]?.url;
      }

      // Resolve SKU & Variant Title
      const effectiveSku = variant?.sku || product?.sku || `SKU-${stock.productId.slice(0, 6)}`;
      const variantTitle = variant?.title ? variant.title : undefined;

      return {
        id: stock.id,
        productId: stock.productId,
        productName: product?.name || 'Unknown Product',
        productSlug: product?.slug || '',
        productThumbnail,
        categoryName: product?.category?.name || undefined,
        productType: product?.productType || 'PHYSICAL',
        variantId: stock.variantId || undefined,
        variantTitle,
        sku: effectiveSku,
        warehouseId: stock.warehouseId,
        warehouseName: warehouse?.name || 'Default Warehouse',
        quantityOnHand: metrics.onHand,
        quantityReserved: metrics.reserved,
        availableQuantity: metrics.available,
        lowStockThreshold,
        trackInventory,
        allowBackorder,
        status: metrics.status,
        updatedAt: stock.updatedAt,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
