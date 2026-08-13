import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovementEntity } from '../entities/inventory-movement.entity';

@Injectable()
export class ListStockMovementsService {
  constructor(
    @InjectRepository(InventoryMovementEntity)
    private readonly movementRepository: Repository<InventoryMovementEntity>,
  ) {}

  async execute(productId: string, tenantId: string): Promise<InventoryMovementEntity[]> {
    return this.movementRepository.find({
      where: { productId, tenantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
