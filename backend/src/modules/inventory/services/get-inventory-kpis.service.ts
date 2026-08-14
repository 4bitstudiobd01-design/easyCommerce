import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryKpiResponseDto } from '../dto/inventory-kpi-response.dto';

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
