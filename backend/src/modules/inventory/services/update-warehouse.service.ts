import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';

@Injectable()
export class UpdateWarehouseService {
  constructor(
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
  ) {}

  async execute(tenantId: string, warehouseId: string, dto: UpdateWarehouseDto): Promise<WarehouseEntity> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId, tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse "${warehouseId}" not found or access denied.`);
    }

    if (dto.code && dto.code !== warehouse.code) {
      const existing = await this.warehouseRepository.findOne({
        where: { code: dto.code, tenantId, id: Not(warehouseId) },
      });
      if (existing) {
        throw new ConflictException(`A warehouse with code "${dto.code}" already exists.`);
      }
    }

    if (dto.name !== undefined) warehouse.name = dto.name;
    if (dto.code !== undefined) warehouse.code = dto.code;
    if (dto.address !== undefined) warehouse.address = dto.address;
    if (dto.phone !== undefined) warehouse.phone = dto.phone;

    if (dto.isDefault === true && !warehouse.isDefault) {
      // Only one warehouse can be the default fulfillment location.
      await this.warehouseRepository.update({ tenantId, isDefault: true }, { isDefault: false });
      warehouse.isDefault = true;
    } else if (dto.isDefault === false) {
      warehouse.isDefault = false;
    }

    return this.warehouseRepository.save(warehouse);
  }
}
