import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VoidPaymentDto {
  @ApiProperty({ example: 'Recorded with the wrong amount' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
