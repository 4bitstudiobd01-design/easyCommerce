import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'owner@mystore.com',
    description: 'User / Merchant email address or phone number',
  })
  @IsString()
  @IsNotEmpty({ message: 'Email or phone number is required' })
  identifier: string;

  @ApiProperty({ example: 'Secret123!', description: 'Password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Issue a long-lived refresh token so the session survives browser restarts',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
