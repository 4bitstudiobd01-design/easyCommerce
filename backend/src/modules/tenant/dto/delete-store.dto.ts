import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteStoreDto {
  @ApiProperty({ description: 'Account password, required to confirm this destructive action' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Must exactly match the store name being deleted' })
  @IsString()
  @IsNotEmpty()
  confirmStoreName: string;
}
