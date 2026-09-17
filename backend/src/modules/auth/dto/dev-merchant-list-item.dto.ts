import { ApiProperty } from '@nestjs/swagger';

export class DevMerchantStoreDto {
  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  id: string;

  @ApiProperty({ example: "Rahim's Fashion House" })
  name: string;

  @ApiProperty({ example: 'rahims-fashion' })
  slug: string;
}

export class DevMerchantListItemDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  userId: string;

  @ApiProperty({ example: 'Rahim Uddin' })
  fullName: string;

  @ApiProperty({ example: 'owner@mystore.com' })
  email: string;

  @ApiProperty({ type: [DevMerchantStoreDto] })
  stores: DevMerchantStoreDto[];
}
