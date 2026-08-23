import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'owner@mystore.com', description: 'Account email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '482913', description: '6-digit OTP sent to the email' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be a 6-digit code' })
  otp: string;

  @ApiProperty({ example: 'NewSecret123!', description: 'New password (min 6 chars)' })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  newPassword: string;
}
