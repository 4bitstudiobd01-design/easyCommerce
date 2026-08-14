import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryDomainService } from './inventory-domain.service';
import { ListProductVariantInventoryQueryDto } from '../dto/list-product-variant-inventory-query.dto';
import {
  ProductVariantInventoryResponseDto,
  ProductVariantInventoryItemDto,
  ProductVariantInventorySummaryDto,
} from '../dto/product-variant-inventory-response.dto';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

@Injectable()
export class GetProductVariantInventoryService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    private readonly inventoryDomainService: InventoryDomainService,
  ) {}

  async execute(
    tenantId: string,
    productId: string,
    query: ListProductVariantInventoryQueryDto,
  ): Promise<ProductVariantInventoryResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    // 1. Verify product ownership and tenant isolation
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
      relations: ['category', 'images'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found or access denied.`);
    }

    // Resolve primary image thumbnail
    let productThumbnail: string | undefined = undefined;
    if (Array.isArray(product.images) && product.images.length > 0) {
      const sortedImages = [...product.images].sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
      productThumbnail = sortedImages[0]?.url;
    }

    // 2. Fetch all variants belonging to this product
    const allVariants = await this.variantRepository.find({
      where: { productId: product.id, tenantId },
      relations: ['image'],
      order: { createdAt: 'ASC' },
    });

    // 3. Fetch all inventory stock records for this product
    const allStocks = await this.stockRepository.find({
      where: { productId: product.id, tenantId },
      relations: ['warehouse'],
    });

    const stockMapByVariantId = new Map<string, InventoryStockEntity>();
    let defaultProductStock: InventoryStockEntity | undefined = undefined;

    for (const stock of allStocks) {
      if (stock.variantId) {
        stockMapByVariantId.set(stock.variantId, stock);
      } else {
        defaultProductStock = stock;
      }
    }

    // 4. Transform all variants into inventory items with canonical domain metrics
    let allItems: ProductVariantInventoryItemDto[] = [];

    if (allVariants.length > 0) {
      allItems = allVariants.map((v) => {
        const stock = stockMapByVariantId.get(v.id);
        const onHand = stock ? stock.quantityOnHand : 0;
        const reserved = stock ? stock.quantityReserved : 0;
        const lowStockThreshold = stock?.reorderPoint ?? product.lowStockThreshold ?? 10;
        const trackInventory = product.trackInventory;
        const allowBackorder = product.allowBackorder;

        const metrics = this.inventoryDomainService.computeStockMetrics({
          onHand,
          reserved,
          lowStockThreshold,
          trackInventory,
          allowBackorder,
        });

        return {
          inventoryStockId: stock?.id,
          variantId: v.id,
          variantTitle: v.title || 'Standard Variant',
          sku: v.sku || product.sku || undefined,
          imageUrl: v.image?.url || productThumbnail,
          quantityOnHand: metrics.onHand,
          quantityReserved: metrics.reserved,
          availableQuantity: metrics.available,
          lowStockThreshold: metrics.lowStockThreshold,
          status: metrics.status,
          warehouseName: stock?.warehouse?.name,
          warehouseId: stock?.warehouseId,
          isInitialized: Boolean(stock),
          updatedAt: stock?.updatedAt || v.updatedAt,
        };
      });
    } else {
      // Non-variant product fallback row
      const onHand = defaultProductStock ? defaultProductStock.quantityOnHand : 0;
      const reserved = defaultProductStock ? defaultProductStock.quantityReserved : 0;
      const lowStockThreshold = defaultProductStock?.reorderPoint ?? product.lowStockThreshold ?? 10;

      const metrics = this.inventoryDomainService.computeStockMetrics({
        onHand,
        reserved,
        lowStockThreshold,
        trackInventory: product.trackInventory,
        allowBackorder: product.allowBackorder,
      });

      allItems = [
        {
          inventoryStockId: defaultProductStock?.id,
          variantId: 'default',
          variantTitle: 'Default (No Variants)',
          sku: product.sku || undefined,
          imageUrl: productThumbnail,
          quantityOnHand: metrics.onHand,
          quantityReserved: metrics.reserved,
          availableQuantity: metrics.available,
          lowStockThreshold: metrics.lowStockThreshold,
          status: metrics.status,
          warehouseName: defaultProductStock?.warehouse?.name,
          warehouseId: defaultProductStock?.warehouseId,
          isInitialized: Boolean(defaultProductStock),
          updatedAt: defaultProductStock?.updatedAt || product.updatedAt,
        },
      ];
    }

    // 5. Compute authoritative server-side Product Variant Summary across all items
    const summary: ProductVariantInventorySummaryDto = {
      totalVariants: allVariants.length,
      totalOnHand: allItems.reduce((acc, curr) => acc + curr.quantityOnHand, 0),
      totalReserved: allItems.reduce((acc, curr) => acc + curr.quantityReserved, 0),
      totalAvailable: allItems.reduce((acc, curr) => acc + curr.availableQuantity, 0),
      lowStockVariants: allItems.filter((i) => i.status === StockStatus.LOW_STOCK).length,
      outOfStockVariants: allItems.filter((i) => i.status === StockStatus.OUT_OF_STOCK).length,
      inStockVariants: allItems.filter((i) => i.status === StockStatus.IN_STOCK).length,
    };

    // 6. Apply Search Filtering
    let filteredItems = allItems;
    if (query.search && query.search.trim() !== '') {
      const term = query.search.trim().toLowerCase();
      filteredItems = filteredItems.filter(
        (i) =>
          i.variantTitle.toLowerCase().includes(term) ||
          (i.sku && i.sku.toLowerCase().includes(term)),
      );
    }

    // 7. Apply Status Filtering
    if (query.status) {
      filteredItems = filteredItems.filter((i) => i.status === query.status);
    }

    // 8. Sorting
    const sortField = query.sortBy || 'title';
    const isAsc = query.sortOrder !== 'DESC';

    filteredItems.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'available':
          cmp = a.availableQuantity - b.availableQuantity;
          break;
        case 'onHand':
          cmp = a.quantityOnHand - b.quantityOnHand;
          break;
        case 'sku':
          cmp = (a.sku || '').localeCompare(b.sku || '');
          break;
        case 'updatedAt':
          cmp = new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
          break;
        case 'title':
        default:
          cmp = a.variantTitle.localeCompare(b.variantTitle);
          break;
      }
      return isAsc ? cmp : -cmp;
    });

    // 9. Pagination
    const total = filteredItems.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku || undefined,
        categoryName: product.category?.name || undefined,
        thumbnail: productThumbnail,
        trackInventory: product.trackInventory,
        hasVariants: product.hasVariants || allVariants.length > 0,
      },
      summary,
      data: paginatedItems,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
