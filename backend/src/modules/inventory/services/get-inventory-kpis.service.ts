import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryKpiResponseDto } from '../dto/inventory-kpi-response.dto';
import { ProductStatus } from '../../catalog/enums/product-status.enum';

@Injectable()
export class GetInventoryKpisService {
  constructor(
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
  ) {}

  async execute(tenantId: string): Promise<InventoryKpiResponseDto> {
    // Highly optimized single aggregate query computing tenant-wide KPIs in database
    const rawResult = await this.stockRepository
      .createQueryBuilder('stock')
      .leftJoin('stock.product', 'product')
      .where('stock.tenantId = :tenantId', { tenantId })
      // Exclude the product-level placeholder row of a variant product (its stock
      // lives on the variant rows), so it does not inflate totalItems and add a
      // phantom out-of-stock count. Matches ListInventoryService.
      .andWhere('NOT (product.hasVariants = true AND stock.variantId IS NULL)')
      // Archived products are out of the catalogue and must not be counted here,
      // matching ListInventoryService.
      .andWhere('product.status != :archivedStatus', { archivedStatus: ProductStatus.ARCHIVED })
      .select([
        'COUNT(stock.id)::int AS "totalItems"',
        'COALESCE(SUM(stock.quantityOnHand), 0)::int AS "totalUnits"',
        `COUNT(CASE WHEN product."trackInventory" = true AND (stock."quantityOnHand" - stock."quantityReserved") > 0 AND (stock."quantityOnHand" - stock."quantityReserved") <= COALESCE(stock."reorderPoint", product."lowStockThreshold", 10) THEN 1 END)::int AS "lowStockCount"`,
        `COUNT(CASE WHEN product."trackInventory" = true AND (stock."quantityOnHand" - stock."quantityReserved") <= 0 THEN 1 END)::int AS "outOfStockCount"`,
        `COUNT(CASE WHEN (product."trackInventory" = false) OR ((stock."quantityOnHand" - stock."quantityReserved") > COALESCE(stock."reorderPoint", product."lowStockThreshold", 10)) THEN 1 END)::int AS "inStockCount"`,
      ])

      .getRawOne();

    return {
      totalItems: Number(rawResult?.totalItems || 0),
      totalUnits: Number(rawResult?.totalUnits || 0),
      lowStockCount: Number(rawResult?.lowStockCount || 0),
      outOfStockCount: Number(rawResult?.outOfStockCount || 0),
      inStockCount: Number(rawResult?.inStockCount || 0),
    };
  }
}
