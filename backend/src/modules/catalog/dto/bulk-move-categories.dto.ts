import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class BulkMoveCategoriesDto {
  @ApiProperty({ example: ['cat-uuid-1', 'cat-uuid-2'], description: 'Category IDs to move' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one category to move' })
  @ArrayMaxSize(500, { message: 'Cannot move more than 500 categories at once' })
  @IsUUID('4', { each: true, message: 'Each category ID must be a valid UUID' })
  categoryIds: string[];

  @ApiPropertyOptional({
    example: 'cat-parent-uuid',
    description: 'Target parent category ID (omit or pass null to move to root)',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID or null' })
  newParentId?: string | null;
}
