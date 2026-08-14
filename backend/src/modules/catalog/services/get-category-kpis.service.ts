import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CategoryKpisDto } from '../dto/category-kpis.dto';

@Injectable()
export class GetCategoryKpisService {
  constructor(private readonly dataSource: DataSource) {}

  async execute(tenantId: string): Promise<CategoryKpisDto> {
    const rawResult = await this.dataSource.query(
      `
      SELECT
        COUNT(c.id)::int AS "totalCategories",
        COUNT(c.id) FILTER (WHERE c.status = 'ACTIVE')::int AS "activeCategories",
        COUNT(c.id) FILTER (WHERE c."parentId" IS NULL)::int AS "parentCategories",
        COUNT(c.id) FILTER (WHERE NOT EXISTS (
          SELECT 1 FROM products p WHERE p."categoryId" = c.id AND p."tenantId" = $1
        ))::int AS "emptyCategories"
      FROM categories c
      WHERE c."tenantId" = $1
      `,
      [tenantId],
    );

    const row = rawResult[0] || {};
    const totalCategories = Number(row.totalCategories || 0);
    const activeCategories = Number(row.activeCategories || 0);
    const parentCategories = Number(row.parentCategories || 0);
    const emptyCategories = Number(row.emptyCategories || 0);

    const activePercentage =
      totalCategories > 0
        ? Number(((activeCategories / totalCategories) * 100).toFixed(1))
        : 0;

    return {
      totalCategories,
      activeCategories,
      activePercentage,
      parentCategories,
      emptyCategories,
    };
  }
}
