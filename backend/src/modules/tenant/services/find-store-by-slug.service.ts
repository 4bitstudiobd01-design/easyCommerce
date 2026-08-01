import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../entities/store.entity';

@Injectable()
export class FindStoreBySlugService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(slug: string): Promise<StoreEntity> {
    const store = await this.storeRepository.findOne({
      where: { slug: slug.toLowerCase(), isActive: true },
    });

    if (!store) {
      throw new NotFoundException(`Store with slug "${slug}" not found.`);
    }

    return store;
  }
}
