import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryStatus } from '../enums/category-status.enum';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';

export interface PublicStoreCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
}

@Injectable()
export class FindPublicStoreCategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly findStoreBySlugService: FindStoreBySlugService,
  ) {}

  async execute(slug: string): Promise<PublicStoreCategory[]> {
    const store = await this.findStoreBySlugService.execute(slug);

    const categories = await this.categoryRepository.find({
      where: {
        tenantId: store.tenantId,
        status: CategoryStatus.ACTIVE,
        isVisible: true,
        showInStorefront: true,
      },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      icon: c.icon,
    }));
  }
}
