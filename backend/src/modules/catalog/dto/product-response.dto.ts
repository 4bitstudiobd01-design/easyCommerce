import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: "Men's Premium Cotton Shirt" })
  title: string;

  @ApiProperty({ example: 'mens-premium-cotton-shirt' })
  slug: string;

  @ApiProperty({ example: 1450 })
  basePrice: number;

  @ApiProperty({ example: 1800, required: false })
  compareAtPrice?: number;

  @ApiProperty({ example: true })
  isPublished: boolean;

  @ApiProperty({ example: 'Fashion & Apparel', required: false })
  categoryName?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf', required: false })
  imageUrl?: string;

  @ApiProperty({ example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33' })
  tenantId: string;
}
