import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class FindCategoryByIdService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async execute(categoryId: string, tenantId: string): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, tenantId },
      relations: ['subcategories', 'parentCategory'],
    });

    if (!category) {
      throw new NotFoundException('Category not found in this store');
    }

    // Compute products count and subcategories count for this category
    const rawCounts = await this.categoryRepository
      .createQueryBuilder('c')
      .where('c.id = :categoryId AND c.tenantId = :tenantId', { categoryId, tenantId })
      .select([
        '(SELECT COUNT(p.id)::int FROM products p WHERE p."categoryId" = c.id AND p."tenantId" = :tenantId) AS "productsCount"',
        '(SELECT COUNT(sub.id)::int FROM categories sub WHERE sub."parentId" = c.id AND sub."tenantId" = :tenantId) AS "subcategoriesCount"',
      ])
      .getRawOne();

    const productsCount = Number(rawCounts?.productsCount || 0);
    const subcategoriesCount = Number(rawCounts?.subcategoriesCount || 0);

    // If subcategories exist, compute their product counts
    let enrichedSubcategories = category.subcategories || [];
    if (enrichedSubcategories.length > 0) {
      const subcategoryIds = enrichedSubcategories.map((s) => s.id);
      const subCounts = await this.categoryRepository.query(
        `SELECT p."categoryId" AS "id", COUNT(p.id)::int AS "count"
         FROM products p
         WHERE p."categoryId" = ANY($1) AND p."tenantId" = $2
         GROUP BY p."categoryId"`,
        [subcategoryIds, tenantId],
      );

      const countMap = new Map<string, number>();
      subCounts.forEach((row: any) => countMap.set(row.id, Number(row.count || 0)));

      enrichedSubcategories = enrichedSubcategories.map((sub) => ({
        ...sub,
        productsCount: countMap.get(sub.id) || 0,
      })) as any[];
    }

    return Object.assign(category, {
      productsCount,
      subcategoriesCount,
      subcategories: enrichedSubcategories,
    });
  }
}
