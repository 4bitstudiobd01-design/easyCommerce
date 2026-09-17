import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength, IsArray, IsUUID, IsNumber, Min, IsBoolean, IsDateString, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductType } from '../enums/product-type.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { TaxCategory } from '../enums/tax-category.enum';
import { ProductDiscountType } from '../enums/product-discount-type.enum';
import { HomepageSection } from '../enums/homepage-section.enum';
import {
  WeightUnit,
  DimensionUnit,
  DigitalDeliveryType,
  ServiceDeliveryType,
  ServiceDurationUnit,
} from '../enums/fulfillment.enum';

export class UpdateProductDto {
  @ApiProperty({ example: "Men's Premium Organic Cotton Shirt", description: 'Updated product name', required: false })
  @IsOptional()
  @IsNotEmpty({ message: 'Product name cannot be empty when provided' })
  @IsString({ message: 'Product name must be a string' })
  @MaxLength(255, { message: 'Product name cannot exceed 255 characters' })
  @Transform(({ value, obj }) => (value || obj.title)?.trim())
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Updated product description', description: 'Updated detailed description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ProductType, example: ProductType.PHYSICAL, description: 'Updated product type', required: false })
  @IsOptional()
  @IsEnum(ProductType, { message: 'productType must be one of PHYSICAL, DIGITAL, SERVICE' })
  productType?: ProductType;

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.ACTIVE, description: 'Updated product status', required: false })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'status must be one of DRAFT, ACTIVE, ARCHIVED' })
  status?: ProductStatus;

  @ApiProperty({ example: 'mens-premium-organic-cotton-shirt', description: 'Updated custom URL slug', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  // --- INVENTORY & SKU FIELDS (CHUNK 8) ---
  @ApiProperty({ example: 'TS-BLK-001', description: 'Product SKU', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: '8940001234567', description: 'Product Barcode', required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: false, description: 'Whether this product is sold in multiple variant options (Color, Size, ...)', required: false })
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @ApiProperty({ example: true, description: 'Track stock inventory', required: false })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiProperty({ example: false, description: 'Allow backorders', required: false })
  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;

  @ApiProperty({ example: 10, description: 'Low stock threshold', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  // --- PRICING & TAX FIELDS ---
  @ApiProperty({ example: 1250, description: 'Base selling price', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Base price cannot be negative' })
  basePrice?: number;

  @ApiProperty({ example: 1500, description: 'Compare-at original price', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Compare-at price cannot be negative' })
  compareAtPrice?: number;

  @ApiProperty({ example: 700, description: 'Internal merchant cost price', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Cost price cannot be negative' })
  costPrice?: number;

  @ApiProperty({ example: 15, description: 'Tax percentage rate', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Tax rate cannot be negative' })
  taxRate?: number;

  @ApiProperty({ example: false, description: 'Whether base price includes tax', required: false })
  @IsOptional()
  @IsBoolean()
  isTaxInclusive?: boolean;

  @ApiProperty({ enum: TaxCategory, example: TaxCategory.STANDARD_VAT, description: 'Tax category classification', required: false })
  @IsOptional()
  @IsEnum(TaxCategory)
  taxCategory?: TaxCategory;

  @ApiProperty({ enum: ProductDiscountType, example: ProductDiscountType.PERCENTAGE, description: 'Discount type', required: false })
  @IsOptional()
  @IsEnum(ProductDiscountType)
  discountType?: ProductDiscountType;

  @ApiProperty({ example: 10, description: 'Discount value', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Discount value cannot be negative' })
  discountValue?: number;

  @ApiProperty({ example: '2026-08-15T00:00:00Z', description: 'Discount schedule start datetime', required: false })
  @IsOptional()
  @IsDateString()
  discountStartsAt?: string;

  @ApiProperty({ example: '2026-08-25T23:59:59Z', description: 'Discount schedule end datetime', required: false })
  @IsOptional()
  @IsDateString()
  discountEndsAt?: string;

  @ApiProperty({ example: 'category-uuid-1', description: 'Category ID', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'brand-uuid-1', description: 'Brand ID', required: false })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiProperty({ example: ['collection-uuid-1'], description: 'List of Collection IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  collectionIds?: string[];

  @ApiProperty({ example: true, description: 'Show this product on the storefront (independent of status)', required: false })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({ enum: HomepageSection, isArray: true, description: 'Which homepage sections feature this product', required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(HomepageSection, { each: true })
  homepageSections?: HomepageSection[];

  // --- SHIPPING & FULFILLMENT DTO FIELDS (CHUNK 10) ---
  @IsOptional()
  @IsBoolean()
  shippingRequired?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsEnum(WeightUnit)
  weightUnit?: WeightUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsEnum(DimensionUnit)
  dimensionUnit?: DimensionUnit;

  @IsOptional()
  @IsUUID()
  shippingProfileId?: string;

  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @IsOptional()
  @IsEnum(DigitalDeliveryType)
  digitalDeliveryType?: DigitalDeliveryType;

  @IsOptional()
  @IsString()
  digitalAssetUrl?: string;

  @IsOptional()
  @IsInt()
  downloadLimit?: number;

  @IsOptional()
  @IsInt()
  downloadExpiryDays?: number;

  @IsOptional()
  @IsEnum(ServiceDeliveryType)
  serviceDeliveryType?: ServiceDeliveryType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceDuration?: number;

  @IsOptional()
  @IsEnum(ServiceDurationUnit)
  serviceDurationUnit?: ServiceDurationUnit;
}
