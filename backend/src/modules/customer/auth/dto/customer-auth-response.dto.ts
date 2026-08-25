import { ApiProperty } from '@nestjs/swagger';

export class CustomerPayloadDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'customer@example.com' })
  email: string;

  @ApiProperty({ example: 'Rahim' })
  firstName: string;

  @ApiProperty({ example: 'Uddin' })
  lastName: string;

  @ApiProperty({ example: '01700000000' })
  phone: string;
}

export class CustomerAuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  refreshToken: string;

  @ApiProperty({ type: CustomerPayloadDto })
  user: CustomerPayloadDto;
}
