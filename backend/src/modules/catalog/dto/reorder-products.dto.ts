import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class ReorderProductsDto {
  @ApiProperty({ example: ['product-uuid-1', 'product-uuid-2'], description: 'Full ordered list of product IDs for the set being reordered' })
  @IsArray({ message: 'productIds must be an array' })
  @ArrayNotEmpty({ message: 'productIds cannot be empty' })
  @IsUUID('4', { each: true, message: 'Each item in productIds must be a valid UUID' })
  productIds: string[];
}
