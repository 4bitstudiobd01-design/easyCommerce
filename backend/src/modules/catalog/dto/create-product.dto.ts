import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: "Men's Premium Cotton Shirt", description: 'Product title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'High quality 100% breathable cotton shirt.', description: 'Product description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1450, description: 'Base selling price in BDT' })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({ example: 1800, description: 'Compare at original price (for discounts)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiProperty({ example: 'SHIRT-COTTON-001', description: 'Stock Keeping Unit (SKU)' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Category UUID', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf', description: 'Primary product image URL', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
