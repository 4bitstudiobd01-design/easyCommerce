import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Order UUID' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}
