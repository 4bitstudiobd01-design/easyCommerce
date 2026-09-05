import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CreateCategoryService } from './create-category.service';

export interface SeedCategoryDemoResult {
  success: boolean;
  message: string;
  categoriesCreated: number;
}

/**
 * A small two-level demo category tree. Parents are created first, then each
 * child references its parent by the id returned from CreateCategoryService.
 */
const DEMO_TREE: { name: string; description: string; children: string[] }[] = [
  {
    name: "Men's Fashion",
    description: 'Clothing, footwear and accessories for men.',
    children: ['T-Shirts', 'Shirts', 'Trousers', 'Shoes'],
  },
  {
    name: "Women's Fashion",
    description: 'Clothing, footwear and accessories for women.',
    children: ['Kurtis', 'Sarees', 'Tops', 'Handbags'],
  },
  {
    name: 'Electronics',
    description: 'Phones, gadgets and home electronics.',
    children: ['Smartphones', 'Headphones', 'Chargers & Cables', 'Smart Watches'],
  },
  {
    name: 'Home & Living',
    description: 'Furniture, kitchen and décor.',
    children: ['Kitchenware', 'Bedding', 'Lighting'],
  },
];

/**
 * Seeds a demo category tree so the Categories page shows data immediately in
 * dev. Idempotent — if the store already has categories it does nothing. Uses
 * CreateCategoryService so slug generation and hierarchy validation run.
 */
@Injectable()
export class SeedCategoryDemoDataService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly createCategoryService: CreateCategoryService,
  ) {}

  async execute(tenantId: string): Promise<SeedCategoryDemoResult> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'The category demo seeder is disabled in production environments.',
      );
    }

    const existing = await this.categoryRepository.count({ where: { tenantId } });
    if (existing > 0) {
      return {
        success: true,
        message: 'Categories already present — nothing seeded.',
        categoriesCreated: 0,
      };
    }

    let categoriesCreated = 0;
    let parentSort = 0;

    for (const parent of DEMO_TREE) {
      const parentCategory = await this.createCategoryService.execute(tenantId, {
        name: parent.name,
        description: parent.description,
        sortOrder: parentSort++,
        isFeatured: true,
      });
      categoriesCreated++;

      let childSort = 0;
      for (const childName of parent.children) {
        await this.createCategoryService.execute(tenantId, {
          name: childName,
          parentId: parentCategory.id,
          sortOrder: childSort++,
        });
        categoriesCreated++;
      }
    }

    return {
      success: true,
      message: 'Category demo data seeded.',
      categoriesCreated,
    };
  }
}
