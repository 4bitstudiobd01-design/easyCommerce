import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { BranchStockEntity } from '../entities/branch-stock.entity';
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
    @InjectRepository(BranchStockEntity)
    private readonly branchStockRepository: Repository<BranchStockEntity>,
    private readonly inventoryDomainService: InventoryDomainService,
  ) {}

  async execute(
    tenantId: string,
    queryDto: ListInventoryQueryDto,
  ): Promise<InventoryListResponseDto> {
    const isBranchScoped = Boolean(queryDto.branchId && queryDto.branchId.trim() && queryDto.branchId !== 'all');

    return isBranchScoped
      ? this.executeForBranch(tenantId, queryDto)
      : this.executeForWarehouse(tenantId, queryDto);
  }

  private paginationParams(queryDto: ListInventoryQueryDto) {
    const page = Math.max(1, Number(queryDto.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryDto.limit) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  private applyCommonFilters<T extends InventoryStockEntity | BranchStockEntity>(
    qb: SelectQueryBuilder<T>,
    queryDto: ListInventoryQueryDto,
  ) {
    if (queryDto.search && queryDto.search.trim() !== '') {
      const searchTerm = `%${queryDto.search.trim()}%`;
      qb.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR variant.sku ILIKE :search OR variant.title ILIKE :search)',
        { search: searchTerm },
      );
    }

    if (queryDto.categoryId && queryDto.categoryId.trim() !== '' && queryDto.categoryId !== 'all') {
      qb.andWhere('product.categoryId = :categoryId', { categoryId: queryDto.categoryId });
    }

    if (queryDto.productType) {
      qb.andWhere('product.productType = :productType', { productType: queryDto.productType });
    }

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
  }

  // Raw SQL expressions can't be passed to orderBy() directly here: TypeORM's
  // getManyAndCount() re-parses the ORDER BY clause to find "alias.column" pairs
  // for merging the count subquery results, and throws ("alias was not found")
  // on anything that isn't a plain alias reference. Expressions must instead be
  // exposed as a SELECT alias via addSelect(), then ordered by that alias name.
  private applySort<T extends InventoryStockEntity | BranchStockEntity>(
    qb: SelectQueryBuilder<T>,
    queryDto: ListInventoryQueryDto,
  ) {
    const sortOrder = queryDto.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    switch (queryDto.sortBy) {
      case InventorySortField.ON_HAND:
        qb.orderBy('stock.quantityOnHand', sortOrder);
        break;
      case InventorySortField.AVAILABLE:
        qb.addSelect('(stock.quantityOnHand - stock.quantityReserved)', 'available_quantity_sort');
        qb.orderBy('available_quantity_sort', sortOrder);
        break;
      case InventorySortField.NAME:
        qb.orderBy('product.name', sortOrder);
        break;
      case InventorySortField.SKU:
        qb.addSelect('COALESCE(variant.sku, product.sku)', 'sku_sort');
        qb.orderBy('sku_sort', sortOrder);
        break;
      case InventorySortField.UPDATED_AT:
      default:
        qb.orderBy('stock.updatedAt', sortOrder);
        break;
    }
    qb.addOrderBy('stock.id', 'ASC');
  }

  private mapCommonFields(stock: InventoryStockEntity | BranchStockEntity): {
    dto: Omit<InventoryListItemDto, 'warehouseId' | 'warehouseName' | 'branchId' | 'branchName'>;
  } {
    const product = stock.product;
    const variant = stock.variant;

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

    let productThumbnail: string | undefined = undefined;
    if (product && Array.isArray(product.images) && product.images.length > 0) {
      const sortedImages = [...product.images].sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
      productThumbnail = sortedImages[0]?.url;
    }

    const effectiveSku = variant?.sku || product?.sku || `SKU-${stock.productId.slice(0, 6)}`;
    const variantTitle = variant?.title ? variant.title : undefined;

    return {
      dto: {
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
        quantityOnHand: metrics.onHand,
        quantityReserved: metrics.reserved,
        availableQuantity: metrics.available,
        lowStockThreshold,
        trackInventory,
        allowBackorder,
        status: metrics.status,
        updatedAt: stock.updatedAt,
      },
    };
  }

  private async executeForWarehouse(
    tenantId: string,
    queryDto: ListInventoryQueryDto,
  ): Promise<InventoryListResponseDto> {
    const { page, limit, skip } = this.paginationParams(queryDto);

    const qb = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('stock.variant', 'variant')
      .leftJoinAndSelect('stock.warehouse', 'warehouse')
      .where('stock.tenantId = :tenantId', { tenantId });

    this.applyCommonFilters(qb, queryDto);

    if (queryDto.warehouseId && queryDto.warehouseId.trim() !== '' && queryDto.warehouseId !== 'all') {
      qb.andWhere('stock.warehouseId = :warehouseId', { warehouseId: queryDto.warehouseId });
    }

    this.applySort(qb, queryDto);
    qb.skip(skip).take(limit);

    const [rawStocks, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 0;

    const data: InventoryListItemDto[] = rawStocks.map((stock) => {
      const { dto } = this.mapCommonFields(stock);
      return {
        ...dto,
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouse?.name || 'Default Warehouse',
      };
    });

    return { data, meta: { page, limit, total, totalPages } };
  }

  private async executeForBranch(
    tenantId: string,
    queryDto: ListInventoryQueryDto,
  ): Promise<InventoryListResponseDto> {
    const { page, limit, skip } = this.paginationParams(queryDto);

    const qb = this.branchStockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('stock.variant', 'variant')
      .where('stock.tenantId = :tenantId', { tenantId })
      .andWhere('stock.branchId = :branchId', { branchId: queryDto.branchId });

    this.applyCommonFilters(qb, queryDto);
    this.applySort(qb, queryDto);
    qb.skip(skip).take(limit);

    const [rawStocks, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 0;

    const data: InventoryListItemDto[] = rawStocks.map((stock) => {
      const { dto } = this.mapCommonFields(stock);
      return {
        ...dto,
        branchId: stock.branchId,
      };
    });

    return { data, meta: { page, limit, total, totalPages } };
  }
}
