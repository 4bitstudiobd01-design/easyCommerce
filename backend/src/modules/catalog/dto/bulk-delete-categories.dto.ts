import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class BulkDeleteCategoriesDto {
  @ApiProperty({ example: ['cat-uuid-1', 'cat-uuid-2'], description: 'Category IDs to delete' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one category to delete' })
  @ArrayMaxSize(500, { message: 'Cannot delete more than 500 categories at once' })
  @IsUUID('4', { each: true, message: 'Each category ID must be a valid UUID' })
  categoryIds: string[];
}
