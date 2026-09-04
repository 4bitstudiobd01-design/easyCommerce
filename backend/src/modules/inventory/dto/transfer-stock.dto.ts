import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber, IsOptional, IsString } from 'class-validator';

export class TransferStockDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Source warehouse UUID. Provide exactly one of fromWarehouseId/fromBranchId.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fromWarehouseId?: string;

  @ApiProperty({
    description: 'Source branch UUID. Provide exactly one of fromWarehouseId/fromBranchId.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fromBranchId?: string;

  @ApiProperty({
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    description: 'Destination warehouse UUID. Provide exactly one of toWarehouseId/toBranchId.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  toWarehouseId?: string;

  @ApiProperty({
    description: 'Destination branch UUID. Provide exactly one of toWarehouseId/toBranchId.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  toBranchId?: string;

  @ApiProperty({ example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', description: 'Product UUID' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Optional product variant UUID — transfers stock for this specific variant only.',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({ example: 10, description: 'Quantity to transfer' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'Restocking Dhaka outlet', description: 'Optional transfer notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
