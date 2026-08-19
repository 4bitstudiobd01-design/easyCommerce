import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../entities/store.entity';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { FindStoreByUserService } from './find-store-by-user.service';

@Injectable()
export class UpdateStoreService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  async execute(userId: string, dto: UpdateStoreDto, storeId?: string): Promise<StoreEntity> {
    const store = await this.findStoreByUserService.execute(userId, storeId);

    if (!store) {
      throw new NotFoundException('No active store found for this merchant.');
    }

    Object.assign(store, dto);
    return this.storeRepository.save(store);
  }
}
