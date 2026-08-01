import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ListWarehousesService } from './list-warehouses.service';

@Injectable()
export class GetInventoryStockService {
  constructor(
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly listWarehousesService: ListWarehousesService,
  ) {}

  async execute(tenantId: string): Promise<any[]> {
    const warehouses = await this.listWarehousesService.execute(tenantId);
    const defaultWh = warehouses[0];

    const products = await this.productRepository.find({
      where: { tenantId },
      relations: ['category', 'images', 'variants'],
    });

    const stocks = await this.stockRepository.find({
      where: { tenantId },
      relations: ['warehouse'],
    });

    const stockMap = new Map<string, InventoryStockEntity>();
    stocks.forEach((st) => {
      stockMap.set(`${st.productId}_${st.warehouseId}`, st);
    });

    return products.map((product) => {
      const stock = stockMap.get(`${product.id}_${defaultWh.id}`);
      const quantityOnHand = stock ? stock.quantityOnHand : 0;
      const quantityReserved = stock ? stock.quantityReserved : 0;
      const availableQuantity = Math.max(0, quantityOnHand - quantityReserved);
      const reorderPoint = stock ? stock.reorderPoint : 5;

      return {
        id: stock ? stock.id : `virtual-${product.id}`,
        productId: product.id,
        productTitle: product.title,
        productSlug: product.slug,
        sku: product.variants?.[0]?.sku || `SKU-${product.id.slice(0, 6)}`,
        categoryName: product.category?.name || 'Uncategorized',
        warehouseId: defaultWh.id,
        warehouseName: defaultWh.name,
        quantityOnHand,
        quantityReserved,
        availableQuantity,
        reorderPoint,
        isLowStock: availableQuantity <= reorderPoint,
        isOutOfStock: availableQuantity === 0,
      };
    });
  }
}
