import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Fashion & Apparel', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Men clothing items', description: 'Category description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-parent-id', description: 'Parent Category ID for Subcategory', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ example: 'shirt', description: 'Icon name or class', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/...', description: 'Category banner image URL', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: true, description: 'Is featured on storefront', required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
