import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class TrackAbandonedCartDto {
  @ApiProperty({ example: 'John Doe', description: 'Customer name', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ example: '01700000000', description: 'Customer phone number' })
  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  @ApiProperty({ example: 'john@example.com', description: 'Customer email', required: false })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiProperty({ example: 'House 12, Road 5, Dhaka', description: 'Shipping address', required: false })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiProperty({
    description: 'Cart line items as JSON',
    example: [{ productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 2, price: 500 }],
  })
  @IsArray()
  itemsJson: any[];

  @ApiProperty({ example: 1000, description: 'Total cart amount' })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ example: 'my-store', description: 'Store slug the cart belongs to' })
  @IsNotEmpty()
  @IsString()
  storeSlug: string;
}
