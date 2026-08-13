import { Injectable, NotFoundException } from '@nestjs/common';
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

    // Safety: set categoryId to null on associated products (do not delete products!)
    await this.productRepository.update(
      { categoryId, tenantId },
      { categoryId: undefined },
    );

    // Reassign subcategories to root (parentId = null)
    await this.categoryRepository.update(
      { parentId: categoryId, tenantId },
      { parentId: undefined },
    );

    await this.categoryRepository.remove(category);

    return { message: 'Category deleted successfully' };
  }
}
