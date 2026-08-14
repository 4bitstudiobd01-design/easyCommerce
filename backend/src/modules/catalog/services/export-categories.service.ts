import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryListDto } from '../dto/category-list.dto';

@Injectable()
export class ExportCategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  public sanitizeCsvFormula(value: any): string {
    if (value === null || value === undefined) return '';
    const str = value.toString();
    const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousPrefixes.some((prefix) => str.startsWith(prefix))) {
      return "'" + str;
    }
    return str;
  }

  public formatCsvRow(columns: any[]): string {
    return columns
      .map((col) => {
        const sanitized = this.sanitizeCsvFormula(col);
        const escaped = sanitized.replace(/"/g, '""');
        return '"' + escaped + '"';
      })
      .join(',');
  }

  async execute(tenantId: string, query?: CategoryListDto, categoryIds?: string[]): Promise<string> {
    const qb = this.categoryRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.parentCategory', 'parent')
      .select([
        'c.id',
        'c.name',
        'c.slug',
        'c.description',
        'c.parentId',
        'c.status',
        'c.sortOrder',
        'c.isVisible',
        'c.showInStorefront',
        'c.isFeatured',
        'c.seoTitle',
        'c.metaDescription',
        'c.createdAt',
        'c.updatedAt',
        'parent.id',
        'parent.name',
        'parent.slug',
      ])
      .addSelect(
        '(SELECT COUNT(p.id)::int FROM products p WHERE p."categoryId" = c.id AND p."tenantId" = :tenantId)',
        'productsCount',
      )
      .where('c.tenantId = :tenantId', { tenantId });

    if (categoryIds && categoryIds.length > 0) {
      qb.andWhere('c.id IN (:...categoryIds)', { categoryIds });
    }

    if (query?.search && query.search.trim() !== '') {
      const s = `%${query.search.trim()}%`;
      qb.andWhere('(c.name ILIKE :s OR c.slug ILIKE :s OR c.description ILIKE :s)', { s });
    }

    if (query?.status && (query.status as string) !== 'ALL') {
      qb.andWhere('c.status = :status', { status: query.status });
    }

    if (query?.parentId) {
      if (query.parentId === 'root') {
        qb.andWhere('c.parentId IS NULL');
      } else {
        qb.andWhere('c.parentId = :parentId', { parentId: query.parentId });
      }
    }

    qb.orderBy('c.sortOrder', 'ASC').addOrderBy('c.createdAt', 'DESC');

    const rawAndEntities = await qb.getRawAndEntities();

    const headers = [
      'ID',
      'Name',
      'Slug',
      'Description',
      'Parent ID',
      'Parent Name',
      'Status',
      'Sort Order',
      'Is Visible',
      'Show In Storefront',
      'Is Featured',
      'SEO Title',
      'Meta Description',
      'Product Count',
      'Created At',
      'Updated At',
    ];

    const rows: string[] = [this.formatCsvRow(headers)];

    rawAndEntities.entities.forEach((cat, index) => {
      const raw = rawAndEntities.raw[index] || {};
      const productsCount = raw.productsCount ? parseInt(raw.productsCount, 10) : 0;

      rows.push(
        this.formatCsvRow([
          cat.id,
          cat.name,
          cat.slug,
          cat.description || '',
          cat.parentId || '',
          cat.parentCategory?.name || '',
          cat.status,
          cat.sortOrder ?? 0,
          cat.isVisible !== false ? 'TRUE' : 'FALSE',
          cat.showInStorefront !== false ? 'TRUE' : 'FALSE',
          cat.isFeatured ? 'TRUE' : 'FALSE',
          cat.seoTitle || '',
          cat.metaDescription || '',
          productsCount,
          cat.createdAt ? new Date(cat.createdAt).toISOString() : '',
          cat.updatedAt ? new Date(cat.updatedAt).toISOString() : '',
        ]),
      );
    });

    return rows.join('\n');
  }
}
