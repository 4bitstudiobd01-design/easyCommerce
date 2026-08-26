import { ApiProperty } from '@nestjs/swagger';

export class UserPayloadDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'owner@mystore.com' })
  email: string;

  @ApiProperty({ example: 'Rahim Uddin' })
  fullName: string;

  @ApiProperty({ example: 'STORE_OWNER' })
  role: string;
}

export class StorePayloadDto {
  @ApiProperty({ example: 'dfebec8e-b01d-4896-8a96-953aad611468' })
  id: string;

  @ApiProperty({ example: 'My Fashion Store' })
  name: string;

  @ApiProperty({ example: 'my-fashion-store' })
  slug: string;

  @ApiProperty({ example: '9a936a28-9774-4b53-a5c9-58d34346e492' })
  tenantId: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  refreshToken: string;

  @ApiProperty({ type: UserPayloadDto })
  user: UserPayloadDto;

  @ApiProperty({ type: StorePayloadDto, required: false })
  store?: StorePayloadDto;
}
