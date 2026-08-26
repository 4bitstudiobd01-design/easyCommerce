import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';

@Injectable()
export class DeleteWarehouseService {
  constructor(
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
  ) {}

  async execute(tenantId: string, warehouseId: string): Promise<{ message: string }> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId, tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse "${warehouseId}" not found or access denied.`);
    }

    const stockCount = await this.stockRepository.count({ where: { warehouseId, tenantId } });
    if (stockCount > 0) {
      throw new BadRequestException(
        'This warehouse still has stock records linked to it. Move or clear its stock before deleting.',
      );
    }

    if (warehouse.isDefault) {
      const otherCount = await this.warehouseRepository.count({
        where: { tenantId },
      });
      if (otherCount > 1) {
        throw new BadRequestException(
          'Cannot delete the default warehouse while other warehouses exist. Set another warehouse as default first.',
        );
      }
    }

    await this.warehouseRepository.remove(warehouse);
    return { message: 'Warehouse deleted successfully.' };
  }
}
