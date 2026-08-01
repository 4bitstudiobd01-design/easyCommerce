import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../entities/store.entity';

@Injectable()
export class FindStoreByUserService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(ownerId: string): Promise<StoreEntity | null> {
    return this.storeRepository.findOne({
      where: { ownerId, isActive: true },
    });
  }
}
