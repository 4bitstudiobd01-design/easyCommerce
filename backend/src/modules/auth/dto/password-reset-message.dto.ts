import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetMessageDto {
  @ApiProperty({ example: 'If an account exists for this email, a reset code has been sent.' })
  message: string;
}
