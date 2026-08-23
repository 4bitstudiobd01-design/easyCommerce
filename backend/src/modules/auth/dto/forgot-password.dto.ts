import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'owner@mystore.com', description: 'Account email to send the password reset OTP to' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
