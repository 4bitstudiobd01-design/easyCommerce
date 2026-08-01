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

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  refreshToken: string;

  @ApiProperty({ type: UserPayloadDto })
  user: UserPayloadDto;
}
