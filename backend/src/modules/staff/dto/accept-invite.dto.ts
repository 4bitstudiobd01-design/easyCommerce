import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AcceptStaffInviteDto {
  @ApiProperty({ example: 'invite_token_123' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'Pass123456!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
