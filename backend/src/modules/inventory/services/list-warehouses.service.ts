import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseEntity } from '../entities/warehouse.entity';

@Injectable()
export class ListWarehousesService {
  constructor(
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
  ) {}

  async execute(tenantId: string): Promise<WarehouseEntity[]> {
    const warehouses = await this.warehouseRepository.find({
      where: { tenantId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });

    if (warehouses.length === 0) {
      // Auto-initialize Default Warehouse for merchant
      const defaultWh = this.warehouseRepository.create({
        name: 'Main Store Warehouse',
        code: 'WH-MAIN',
        isDefault: true,
        address: 'Main Store Location',
        tenantId,
      });
      const saved = await this.warehouseRepository.save(defaultWh);
      return [saved];
    }

    return warehouses;
  }
}
