import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class DeleteCategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async execute(categoryId: string, tenantId: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const productsCount = await this.productRepository.count({
      where: { categoryId, tenantId },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        `Cannot delete "${category.name}" — it has ${productsCount} product(s) assigned. Move or delete them first.`,
      );
    }

    const subcategoriesCount = await this.categoryRepository.count({
      where: { parentId: categoryId, tenantId },
    });

    if (subcategoriesCount > 0) {
      throw new BadRequestException(
        `Cannot delete "${category.name}" — it has ${subcategoriesCount} subcategory(ies). Move or delete them first.`,
      );
    }

    await this.categoryRepository.remove(category);

    return { message: 'Category deleted successfully' };
  }
}
