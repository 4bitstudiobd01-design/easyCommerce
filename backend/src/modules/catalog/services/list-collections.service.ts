import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionEntity } from '../entities/collection.entity';

@Injectable()
export class ListCollectionsService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly collectionRepository: Repository<CollectionEntity>,
  ) {}

  async execute(tenantId: string): Promise<CollectionEntity[]> {
    return this.collectionRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }
}
