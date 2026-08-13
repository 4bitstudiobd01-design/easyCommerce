import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { ProductListDto, ALLOWED_PRODUCT_SORT_FIELDS } from '../dto/product-list.dto';
import { ProductStatus } from '../enums/product-status.enum';
import { StockStatus } from '../enums/stock-status.enum';

export interface ProductListResult {
  data: ProductEntity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    statusCounts: {
      ALL: number;
      DRAFT: number;
      ACTIVE: number;
      ARCHIVED: number;
    };
  };
}

@Injectable()
export class ListProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly inventoryStockRepository: Repository<InventoryStockEntity>,
  ) {}

  async execute(tenantId: string, dto?: ProductListDto): Promise<ProductListResult> {
    const params = dto || new ProductListDto();
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.collections', 'collections')
      .leftJoinAndSelect('p.images', 'images')
      .leftJoinAndSelect('p.variants', 'variants')
      .where('p.tenantId = :tenantId', { tenantId });

    // Search filter (Product Name, Slug, SKU, Barcode)
    if (params.search && params.search.trim()) {
      const s = `%${params.search.trim()}%`;
      query.andWhere('(p.name ILIKE :s OR p.slug ILIKE :s OR p.sku ILIKE :s OR p.barcode ILIKE :s)', { s });
    }

    // Status filter
    if (params.status) {
      query.andWhere('p.status = :status', { status: params.status });
    }

    // ProductType filter
    if (params.productType) {
      query.andWhere('p.productType = :productType', { productType: params.productType });
    }

    // Category filter
    if (params.categoryId) {
      query.andWhere('p.categoryId = :categoryId', { categoryId: params.categoryId });
    }

    // Brand filter
    if (params.brandId) {
      query.andWhere('p.brandId = :brandId', { brandId: params.brandId });
    }

    // Collection filter
    if (params.collectionId) {
      query.andWhere('collections.id = :collectionId', { collectionId: params.collectionId });
    }

    // Stock status filter. Resolved in SQL against aggregated warehouse stock so that
    // `total`, `totalPages` and pagination stay consistent with the returned rows —
    // filtering the already-paginated page in memory would report wrong counts.
    if (params.stockStatus) {
      const availableExpr = `(
        SELECT COALESCE(SUM(s."quantityOnHand" - s."quantityReserved"), 0)
        FROM inventory_stocks s
        WHERE s."productId" = p.id AND s."tenantId" = :stockTenantId
      )`;

      if (params.stockStatus === StockStatus.NOT_TRACKED) {
        query.andWhere('p.trackInventory = false');
      } else if (params.stockStatus === StockStatus.OUT_OF_STOCK) {
        query
          .andWhere('p.trackInventory = true')
          .andWhere(`${availableExpr} <= 0`, { stockTenantId: tenantId });
      } else if (params.stockStatus === StockStatus.LOW_STOCK) {
        query
          .andWhere('p.trackInventory = true')
          .andWhere(`${availableExpr} > 0`, { stockTenantId: tenantId })
          .andWhere(`${availableExpr} <= p."lowStockThreshold"`, { stockTenantId: tenantId });
      } else if (params.stockStatus === StockStatus.IN_STOCK) {
        query
          .andWhere('p.trackInventory = true')
          .andWhere(`${availableExpr} > p."lowStockThreshold"`, { stockTenantId: tenantId });
      }
    }

    // Sorting
    const sortOrder = params.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const sortByParam = params.sortBy && ALLOWED_PRODUCT_SORT_FIELDS.includes(params.sortBy as any)
      ? params.sortBy
      : 'createdAt';

    // Only product columns may appear in ORDER BY here. skip/take makes TypeORM build a
    // DISTINCT id subquery, and adding a joined column (images.isPrimary) to that
    // subquery corrupts both the page and the count — a tenant with 34 products
    // returned 4 rows and reported total: 4. Image ordering is applied in memory below.
    query.addOrderBy(`p.${sortByParam}`, sortOrder);
    query.addOrderBy('p.id', 'ASC');

    query.skip(skip).take(limit);

    const [products, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 0;

    // Primary image first, then by sortOrder. Done here rather than in SQL because a
    // joined ORDER BY breaks the paginated DISTINCT subquery (see note above).
    products.forEach((product) => {
      if (Array.isArray(product.images)) {
        product.images.sort(
          (a, b) =>
            Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        );
      }
    });

    // Attach inventory stock info to products without N+1 query overhead
    if (products.length > 0) {
      const productIds = products.map((p) => p.id);
      const stockRecords = await this.inventoryStockRepository.find({
        where: { productId: In(productIds), tenantId },
      });

      // Stock is held per warehouse, so a product can have several rows here. Keeping
      // only one row per product (map.set overwriting) reported a single warehouse's
      // quantity as the product total and mislabelled multi-warehouse products as
      // out of/low on stock. Sum across every warehouse row instead.
      const stockMap = new Map<string, { onHand: number; reserved: number }>();
      stockRecords.forEach((st) => {
        const acc = stockMap.get(st.productId) || { onHand: 0, reserved: 0 };
        acc.onHand += Number(st.quantityOnHand) || 0;
        acc.reserved += Number(st.quantityReserved) || 0;
        stockMap.set(st.productId, acc);
      });

      products.forEach((product) => {
        const stock = stockMap.get(product.id);
        const onHand = stock ? stock.onHand : 0;
        const reserved = stock ? stock.reserved : 0;
        const available = Math.max(0, onHand - reserved);

        let stockStatus = StockStatus.IN_STOCK;
        if (!product.trackInventory) {
          stockStatus = StockStatus.NOT_TRACKED;
        } else if (available <= 0) {
          stockStatus = StockStatus.OUT_OF_STOCK;
        } else if (available <= product.lowStockThreshold) {
          stockStatus = StockStatus.LOW_STOCK;
        }

        (product as any).stockInfo = {
          onHand,
          reserved,
          available,
          trackInventory: product.trackInventory,
          allowBackorder: product.allowBackorder,
          lowStockThreshold: product.lowStockThreshold,
          stockStatus,
        };
      });
    }

    // Fetch tab status counts for tenant
    const statusCountsRaw = await this.productRepository
      .createQueryBuilder('p')
      .select('p.status', 'status')
      .addSelect('COUNT(p.id)::int', 'count')
      .where('p.tenantId = :tenantId', { tenantId })
      .groupBy('p.status')
      .getRawMany();

    const statusCounts = {
      ALL: 0,
      DRAFT: 0,
      ACTIVE: 0,
      ARCHIVED: 0,
    };

    for (const row of statusCountsRaw) {
      const countNum = Number(row.count || 0);
      if (row.status === ProductStatus.DRAFT) {
        statusCounts.DRAFT = countNum;
      } else if (row.status === ProductStatus.ACTIVE) {
        statusCounts.ACTIVE = countNum;
      } else if (row.status === ProductStatus.ARCHIVED) {
        statusCounts.ARCHIVED = countNum;
      }
    }
    statusCounts.ALL = statusCounts.DRAFT + statusCounts.ACTIVE + statusCounts.ARCHIVED;

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages,
        statusCounts,
      },
    };
  }
}
