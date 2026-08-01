import { ApiProperty } from '@nestjs/swagger';

export class StoreResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'Daruchini Fashion' })
  name: string;

  @ApiProperty({ example: 'daruchini' })
  slug: string;

  @ApiProperty({ example: 'Fashion & Apparel', required: false })
  category?: string;

  @ApiProperty({ example: '+8801700000000', required: false })
  phone?: string;

  @ApiProperty({ example: 'BDT' })
  currency: string;

  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' })
  ownerId: string;

  @ApiProperty({ example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33' })
  tenantId: string;
}
