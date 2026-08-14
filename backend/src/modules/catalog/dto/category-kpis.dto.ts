import { ApiProperty } from '@nestjs/swagger';

export class CategoryKpisDto {
  @ApiProperty({ example: 48, description: 'Total categories created in this store' })
  totalCategories: number;

  @ApiProperty({ example: 42, description: 'Number of active categories' })
  activeCategories: number;

  @ApiProperty({ example: 87.5, description: 'Percentage of active categories compared to total' })
  activePercentage: number;

  @ApiProperty({ example: 12, description: 'Number of root parent categories (parentId IS NULL)' })
  parentCategories: number;

  @ApiProperty({ example: 6, description: 'Number of categories with 0 associated products' })
  emptyCategories: number;
}
