import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionEntity } from '../entities/collection.entity';
import { CreateCollectionDto } from '../dto/create-collection.dto';
import { ProductSlugService } from './product-slug.service';

@Injectable()
export class CreateCollectionService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly collectionRepository: Repository<CollectionEntity>,
    private readonly slugService: ProductSlugService,
  ) {}

  async execute(tenantId: string, dto: CreateCollectionDto): Promise<CollectionEntity> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Collection name is required');
    }

    const rawSlug = dto.slug || dto.name;
    const slug = await this.slugService.generateSlug(rawSlug, tenantId);

    const collection = this.collectionRepository.create({
      name: dto.name.trim(),
      slug,
      description: dto.description ? dto.description.trim() : undefined,
      tenantId,
    });

    return this.collectionRepository.save(collection);
  }
}
