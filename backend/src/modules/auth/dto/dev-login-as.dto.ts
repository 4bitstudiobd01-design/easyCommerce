import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class DevLoginAsDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Target merchant (STORE_OWNER) user id' })
  @IsUUID()
  @IsNotEmpty({ message: 'userId is required' })
  userId: string;
}
