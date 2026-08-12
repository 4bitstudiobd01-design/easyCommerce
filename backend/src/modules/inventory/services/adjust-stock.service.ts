import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { AdjustStockDto, StockAdjustmentAction } from '../dto/adjust-stock.dto';
import { ListWarehousesService } from './list-warehouses.service';

@Injectable()
export class AdjustStockService {
  constructor(
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
    private readonly listWarehousesService: ListWarehousesService,
  ) {}

  async execute(tenantId: string, dto: AdjustStockDto): Promise<InventoryStockEntity> {
    let warehouseId = dto.warehouseId;

    if (!warehouseId) {
      const warehouses = await this.listWarehousesService.execute(tenantId);
      warehouseId = warehouses[0].id;
    }

    let stock = await this.stockRepository.findOne({
      where: { productId: dto.productId, warehouseId, tenantId },
    });

    if (!stock) {
      stock = this.stockRepository.create({
        productId: dto.productId,
        warehouseId,
        quantityOnHand: 0,
        quantityReserved: 0,
        reorderPoint: 5,
        tenantId,
      });
    }

    const qty = Number(dto.quantity);

    switch (dto.action) {
      case StockAdjustmentAction.ADD:
        stock.quantityOnHand += qty;
        break;
      case StockAdjustmentAction.SET:
        stock.quantityOnHand = qty;
        break;
      case StockAdjustmentAction.REMOVE:
        if (stock.quantityOnHand - qty < 0) {
          throw new BadRequestException(
            `Insufficient stock for product ${dto.productId}: ${stock.quantityOnHand} on hand, ${qty} requested.`,
          );
        }
        stock.quantityOnHand -= qty;
        break;
      default:
        throw new BadRequestException(`Invalid adjustment action: ${dto.action}`);
    }

    return this.stockRepository.save(stock);
  }
}
