import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryZoneEntity } from '../entities/delivery-zone.entity';
import { CreateDeliveryZoneDto, UpdateDeliveryZoneDto } from '../dto/delivery-zone.dto';

/**
 * CRUD for a store's delivery zones. Area names are normalized to lower case on
 * write so checkout can match a customer's city/area case-insensitively without
 * having to normalize on every read.
 */
@Injectable()
export class ManageDeliveryZonesService {
  constructor(
    @InjectRepository(DeliveryZoneEntity)
    private readonly zoneRepository: Repository<DeliveryZoneEntity>,
  ) {}

  private normalizeAreas(areas?: string[]): string[] {
    if (!areas) return [];
    return areas
      .map((area) => area.trim().toLowerCase())
      .filter((area) => area.length > 0);
  }

  async list(tenantId: string, storeId: string): Promise<DeliveryZoneEntity[]> {
    return this.zoneRepository.find({
      where: { tenantId, storeId },
      order: { createdAt: 'ASC' },
    });
  }

  async create(
    tenantId: string,
    storeId: string,
    dto: CreateDeliveryZoneDto,
  ): Promise<DeliveryZoneEntity> {
    const zone = this.zoneRepository.create({
      tenantId,
      storeId,
      name: dto.name,
      areas: this.normalizeAreas(dto.areas),
      deliveryCharge: dto.deliveryCharge,
      estimatedDeliveryTime: dto.estimatedDeliveryTime,
      isActive: dto.isActive ?? true,
    });
    return this.zoneRepository.save(zone);
  }

  async update(
    tenantId: string,
    zoneId: string,
    dto: UpdateDeliveryZoneDto,
  ): Promise<DeliveryZoneEntity> {
    const zone = await this.zoneRepository.findOne({ where: { id: zoneId, tenantId } });
    if (!zone) {
      throw new NotFoundException('Delivery zone not found.');
    }

    if (dto.name !== undefined) zone.name = dto.name;
    if (dto.areas !== undefined) zone.areas = this.normalizeAreas(dto.areas);
    if (dto.deliveryCharge !== undefined) zone.deliveryCharge = dto.deliveryCharge;
    if (dto.estimatedDeliveryTime !== undefined) zone.estimatedDeliveryTime = dto.estimatedDeliveryTime;
    if (dto.isActive !== undefined) zone.isActive = dto.isActive;

    return this.zoneRepository.save(zone);
  }

  async remove(tenantId: string, zoneId: string): Promise<{ success: boolean }> {
    const result = await this.zoneRepository.delete({ id: zoneId, tenantId });
    if (!result.affected) {
      throw new NotFoundException('Delivery zone not found.');
    }
    return { success: true };
  }
}
