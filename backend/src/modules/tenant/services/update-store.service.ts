import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../entities/store.entity';
import { UpdateStoreDto } from '../dto/update-store.dto';

@Injectable()
export class UpdateStoreService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(userId: string, dto: UpdateStoreDto): Promise<StoreEntity> {
    const store = await this.storeRepository.findOne({ where: { ownerId: userId } });

    if (!store) {
      throw new NotFoundException('No active store found for this merchant.');
    }

    Object.assign(store, dto);
    return this.storeRepository.save(store);
  }
}
