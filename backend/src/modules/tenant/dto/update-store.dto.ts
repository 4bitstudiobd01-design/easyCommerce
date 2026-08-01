import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { SmsDriverEnum, EmailDriverEnum } from '../entities/store.entity';

export class UpdateStoreDto {
  @ApiProperty({ example: 'My Online Fashion Store', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '01700000000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Dhanmondi, Dhaka', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'www.sumonfashion.com', required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ example: 'BDT', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'sf_api_key_123', required: false })
  @IsOptional()
  @IsString()
  steadfastApiKey?: string;

  @ApiProperty({ example: 'sf_secret_key_456', required: false })
  @IsOptional()
  @IsString()
  steadfastSecretKey?: string;

  @ApiProperty({ example: 'pth_client_id_789', required: false })
  @IsOptional()
  @IsString()
  pathaoClientId?: string;

  @ApiProperty({ example: 'pth_client_secret_012', required: false })
  @IsOptional()
  @IsString()
  pathaoClientSecret?: string;

  // Notification Drivers (SMS & Email)
  @ApiProperty({ enum: SmsDriverEnum, required: false })
  @IsOptional()
  @IsEnum(SmsDriverEnum)
  smsDriver?: SmsDriverEnum;

  @ApiProperty({ example: 'sms_api_key_123', required: false })
  @IsOptional()
  @IsString()
  smsApiKey?: string;

  @ApiProperty({ example: 'EASYSTORE', required: false })
  @IsOptional()
  @IsString()
  smsSenderId?: string;

  @ApiProperty({ enum: EmailDriverEnum, required: false })
  @IsOptional()
  @IsEnum(EmailDriverEnum)
  emailDriver?: EmailDriverEnum;

  @ApiProperty({ example: 'smtp.mailtrap.io', required: false })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiProperty({ example: 587, required: false })
  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @ApiProperty({ example: 'smtp_user', required: false })
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiProperty({ example: 'smtp_pass', required: false })
  @IsOptional()
  @IsString()
  smtpPass?: string;

  @ApiProperty({ example: 'no-reply@store.com', required: false })
  @IsOptional()
  @IsString()
  fromEmail?: string;
}
