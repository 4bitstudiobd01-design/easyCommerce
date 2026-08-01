import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../../tenant/entities/store.entity';

@Injectable()
export class ToggleStoreStatusService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(storeId: string): Promise<StoreEntity> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });

    if (!store) {
      throw new NotFoundException(`Store with ID "${storeId}" not found.`);
    }

    store.isActive = !store.isActive;
    return this.storeRepository.save(store);
  }
}
