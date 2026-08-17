import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { CategoryStatus } from '../enums/category-status.enum';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Fashion & Apparel', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'fashion-apparel', description: 'Custom URL slug (optional, auto-generated if omitted)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({ example: 'Men and women clothing items', description: 'Category description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-parent-id', description: 'Parent Category ID for subcategory hierarchy', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ enum: CategoryStatus, example: CategoryStatus.ACTIVE, description: 'Category publication status', required: false })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @ApiProperty({ example: 0, description: 'Display sort order priority', required: false })
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

  @ApiProperty({ example: 'Fashion & Apparel Collection | BitCommerce', description: 'Meta SEO Title', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @ApiProperty({ example: 'Shop top fashion apparel including men, women and kids clothing.', description: 'Meta SEO Description', required: false })
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
