import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../entities/store.entity';

@Injectable()
export class FindStoreByUserService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(ownerId: string, storeId?: string): Promise<StoreEntity | null> {
    if (storeId) {
      const store = await this.storeRepository.findOne({
        where: { id: storeId, ownerId, isActive: true },
      });
      if (store) return store;
    }

    return this.storeRepository.findOne({
      where: { ownerId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findAllStoresByUser(ownerId: string): Promise<StoreEntity[]> {
    return this.storeRepository.find({
      where: { ownerId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }
}
