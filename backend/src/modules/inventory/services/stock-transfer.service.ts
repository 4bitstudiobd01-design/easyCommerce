import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTransferEntity } from '../entities/stock-transfer.entity';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';

@Injectable()
export class StockTransferService {
  constructor(
    @InjectRepository(StockTransferEntity)
    private readonly stockTransferRepository: Repository<StockTransferEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly inventoryStockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async transferStock(
    tenantId: string,
    dto: {
      fromWarehouseId: string;
      toWarehouseId: string;
      productId: string;
      quantity: number;
      notes?: string;
    },
  ): Promise<StockTransferEntity> {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Source warehouse and destination warehouse must be different.');
    }

    if (dto.quantity <= 0) {
      throw new BadRequestException('Transfer quantity must be greater than zero.');
    }

    const fromWarehouse = await this.warehouseRepository.findOne({ where: { id: dto.fromWarehouseId, tenantId } });
    const toWarehouse = await this.warehouseRepository.findOne({ where: { id: dto.toWarehouseId, tenantId } });
    const product = await this.productRepository.findOne({ where: { id: dto.productId, tenantId } });

    if (!fromWarehouse || !toWarehouse) {
      throw new NotFoundException('One or both specified warehouses were not found.');
    }

    if (!product) {
      throw new NotFoundException(`Product with ID "${dto.productId}" not found.`);
    }

    // Source warehouse stock
    let sourceStock = await this.inventoryStockRepository.findOne({
      where: { warehouseId: dto.fromWarehouseId, productId: dto.productId, tenantId },
    });

    if (!sourceStock || sourceStock.quantityOnHand < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock in source warehouse "${fromWarehouse.name}". Available: ${sourceStock ? sourceStock.quantityOnHand : 0}`,
      );
    }

    // Destination warehouse stock
    let destStock = await this.inventoryStockRepository.findOne({
      where: { warehouseId: dto.toWarehouseId, productId: dto.productId, tenantId },
    });

    if (!destStock) {
      destStock = this.inventoryStockRepository.create({
        warehouseId: dto.toWarehouseId,
        productId: dto.productId,
        quantityOnHand: 0,
        quantityReserved: 0,
        reorderPoint: 5,
        tenantId,
      });
    }

    // Perform stock movement
    sourceStock.quantityOnHand -= dto.quantity;
    destStock.quantityOnHand += dto.quantity;

    await this.inventoryStockRepository.save([sourceStock, destStock]);

    const transferLog = this.stockTransferRepository.create({
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
      productId: dto.productId,
      quantity: dto.quantity,
      notes: dto.notes,
      tenantId,
    });

    return this.stockTransferRepository.save(transferLog);
  }

  async listStockTransfers(tenantId: string): Promise<StockTransferEntity[]> {
    return this.stockTransferRepository.find({
      where: { tenantId },
      relations: ['fromWarehouse', 'toWarehouse', 'product'],
      order: { createdAt: 'DESC' },
    });
  }
}
