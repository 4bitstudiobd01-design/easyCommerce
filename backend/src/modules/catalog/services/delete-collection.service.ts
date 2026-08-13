import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionEntity } from '../entities/collection.entity';

@Injectable()
export class DeleteCollectionService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly collectionRepository: Repository<CollectionEntity>,
  ) {}

  async execute(collectionId: string, tenantId: string): Promise<{ message: string }> {
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId, tenantId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    // Removing collection entity will delete product_collections join records without deleting products
    await this.collectionRepository.remove(collection);

    return { message: 'Collection deleted successfully' };
  }
}
