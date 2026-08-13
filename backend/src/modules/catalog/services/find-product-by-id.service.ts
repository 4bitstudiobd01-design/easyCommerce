import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { StockStatus } from '../enums/stock-status.enum';

@Injectable()
export class FindProductByIdService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly inventoryStockRepository: Repository<InventoryStockEntity>,
  ) {}

  async execute(id: string, tenantId: string): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
      // brand, collections and attributeValues are needed by the product details screen;
      // without them the organization and attributes sections rendered as empty.
      relations: [
        'category',
        'brand',
        'collections',
        'variants',
        'images',
        'attributeValues',
        'attributeValues.attribute',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }

    // The list endpoint attaches stockInfo but this one did not, so the details screen
    // had no stock figures to show. Quantities are summed across every warehouse that
    // holds the product, matching ListProductsService.
    const stockRecords = await this.inventoryStockRepository.find({
      where: { productId: In([product.id]), tenantId },
    });

    const onHand = stockRecords.reduce((sum, s) => sum + (Number(s.quantityOnHand) || 0), 0);
    const reserved = stockRecords.reduce((sum, s) => sum + (Number(s.quantityReserved) || 0), 0);
    const available = Math.max(0, onHand - reserved);

    let stockStatus = StockStatus.IN_STOCK;
    if (!product.trackInventory) {
      stockStatus = StockStatus.NOT_TRACKED;
    } else if (available <= 0) {
      stockStatus = StockStatus.OUT_OF_STOCK;
    } else if (available <= product.lowStockThreshold) {
      stockStatus = StockStatus.LOW_STOCK;
    }

    (product as ProductEntity & { stockInfo?: unknown }).stockInfo = {
      onHand,
      reserved,
      available,
      trackInventory: product.trackInventory,
      allowBackorder: product.allowBackorder,
      lowStockThreshold: product.lowStockThreshold,
      stockStatus,
    };

    return product;
  }
}
