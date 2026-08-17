import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CategoryStatus } from '../enums/category-status.enum';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Men Fashion & Apparel', description: 'Updated category name', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ example: 'men-fashion-apparel', description: 'Updated URL slug', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({ example: 'Updated category description', description: 'Category description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-parent-id', description: 'Parent Category ID (null or empty string to unset)', required: false })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsUUID()
  parentId?: string | null;

  @ApiProperty({ enum: CategoryStatus, example: CategoryStatus.ACTIVE, description: 'Category publication status', required: false })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @ApiProperty({ example: 1, description: 'Display sort order priority', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ example: 'shirt', description: 'Icon name or identifier', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/...', description: 'Category banner image URL', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: true, description: 'Is featured on storefront', required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ example: 'Men Fashion & Apparel Collection | BitCommerce', description: 'Meta SEO Title', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @ApiProperty({ example: 'Updated meta SEO Description', description: 'Meta SEO Description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  metaDescription?: string;

  @ApiProperty({ example: true, description: 'Category visibility status', required: false })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({ example: true, description: 'Show category in storefront navigation/menu', required: false })
  @IsOptional()
  @IsBoolean()
  showInStorefront?: boolean;
}
