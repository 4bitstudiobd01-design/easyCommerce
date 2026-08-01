import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';

@Injectable()
export class CreateWarehouseService {
  constructor(
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
  ) {}

  async execute(tenantId: string, dto: CreateWarehouseDto): Promise<WarehouseEntity> {
    const existing = await this.warehouseRepository.findOne({
      where: { code: dto.code, tenantId },
    });

    if (existing) {
      return existing;
    }

    // Check if this is the first warehouse for tenant
    const count = await this.warehouseRepository.count({ where: { tenantId } });

    const warehouse = this.warehouseRepository.create({
      name: dto.name,
      code: dto.code,
      isDefault: dto.isDefault || count === 0,
      address: dto.address,
      phone: dto.phone,
      tenantId,
    });

    return this.warehouseRepository.save(warehouse);
  }
}
